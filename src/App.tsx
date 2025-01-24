import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import {
    BedrockRuntimeClient,
    ContentBlock,
    ConversationRole,
    ConverseCommand,
    ConverseCommandOutput,
    ImageFormat,
    Message,
    ToolResultStatus,
} from "@aws-sdk/client-bedrock-runtime";
import { ChatInput } from "./components/ChatInput/ChatInput";
import { ChatMessage } from "./components/ChatMessage/ChatMessage";
import { convertFileToUint8Array } from "./utils/utils";
import { toolsSchema } from "./tools";

const AWS_REGION = "us-east-1";
const MODEL_ID = "anthropic.claude-3-haiku-20240307-v1:0";
const USER_NAME = "user";

const client = new BedrockRuntimeClient({
    region: AWS_REGION,
    credentials: {
        accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY,
        secretAccessKey: import.meta.env.VITE_AWS_SECRET_KEY,
    },
});

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const tools: Record<string, Function> = {
    sumOfTwoNumbers: ({ x, y }: { x: number; y: number }) => {
        return x + y;
    },
    getCurrencyRates: async ({ baseCurrency }: { baseCurrency: string }) => {
        const rates = await fetch(
            `https://api.vatcomply.com/rates?base=${baseCurrency}`
        );
        return await rates.json();
    },
};

function App() {
    const [history, setHistory] = useState<Message[]>([]);

    const parseResponse = useCallback(
        async (apiResponse: ConverseCommandOutput) => {
            const tempHistory = [...history];
            if (
                apiResponse?.output?.message &&
                apiResponse?.stopReason !== "tool_use"
            ) {
                tempHistory.push(apiResponse?.output?.message);
            }

            if (apiResponse?.stopReason === "tool_use") {
                const toolUse = apiResponse?.output?.message?.content?.find(
                    (block) => block.toolUse
                )?.toolUse;

                if (toolUse) {
                    tempHistory.push({
                        content: [{ toolUse }],
                        role: ConversationRole.ASSISTANT,
                    });
                    const toolResult = await tools[toolUse.name as string](
                        toolUse.input
                    );

                    tempHistory.push({
                        role: ConversationRole.USER,
                        content: [
                            {
                                toolResult: {
                                    toolUseId: toolUse.toolUseId,
                                    content: [
                                        {
                                            json: { results: toolResult },
                                        },
                                    ],
                                    status: ToolResultStatus.SUCCESS,
                                },
                            },
                        ],
                    });
                    const response = await sendResponse(tempHistory ?? []);
                    await parseResponse(response);
                }
            }

            setHistory([...tempHistory]);
        },
        [history]
    );

    useEffect(() => {
        const lastMessage = history[history.length - 1];
        const callModel = async (messages: Message[]) => {
            const response = await sendResponse([...messages]);
            await parseResponse(response);
        };
        if (lastMessage?.role === ConversationRole.USER) {
            callModel(history);
        }
    }, [history, parseResponse]);

    const sendResponse = async (messages: Message[]) => {
        const apiResponse = await client.send(
            new ConverseCommand({
                modelId: MODEL_ID,
                messages: messages,
                inferenceConfig: {
                    maxTokens: 512,
                    temperature: 0.5,
                    topP: 0.9,
                },
                toolConfig: {
                    tools: toolsSchema,
                },
            })
        );

        return apiResponse;
    };

    const onSubmit = async (prompt: string, file?: File | null) => {
        const content: ContentBlock[] = [{ text: prompt }];

        if (file) {
            content.push({
                image: {
                    format: file?.name.split(".").reverse()[0] as ImageFormat,
                    source: {
                        bytes: await convertFileToUint8Array(file),
                    },
                },
            });
        }

        setHistory((prev) => [
            ...prev,
            {
                content,
                role: USER_NAME,
            },
        ]);
    };

    return (
        <div className="flex flex-col h-screen p-4">
            <div className="overflow-y-scroll flex-1">
                {history.map(({ role, content }) => {
                    return content?.map((contentBlock) => {
                        if (contentBlock.text) {
                            return (
                                <ChatMessage
                                    key={contentBlock.text}
                                    author={role || ""}
                                    reverse={role === USER_NAME}
                                    text={contentBlock.text || ""}
                                />
                            );
                        }
                    });
                })}
            </div>

            <div className="flex items-center justify-between mt-auto h-20 sticky bottom-0 left-0 right-0">
                <ChatInput onSubmit={onSubmit} />
            </div>
        </div>
    );
}

export default App;
