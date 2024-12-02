import { useState } from "react";
import "./App.css";
import {
    BedrockRuntimeClient,
    ContentBlock,
    ConversationRole,
    ConverseStreamCommand,
    ConverseStreamCommandOutput,
    ImageFormat,
} from "@aws-sdk/client-bedrock-runtime";
import { ChatInput } from "./components/ChatInput/ChatInput";
import { ChatMessage } from "./components/ChatMessage/ChatMessage";
import { convertFileToUint8Array } from "./utils/utils";

const AWS_REGION = "us-east-1";
const MODEL_ID = "anthropic.claude-3-haiku-20240307-v1:0";
const MODEL_NAME = "assistant";
const USER_NAME = "user";

const client = new BedrockRuntimeClient({
    region: AWS_REGION,
    credentials: {
        accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY,
        secretAccessKey: import.meta.env.VITE_AWS_SECRET_KEY,
    },
});

interface IMessage {
    role: ConversationRole;
    content: { text: string; file?: File }[];
}

function App() {
    const [history, setHistory] = useState<IMessage[]>([]);

    const [stream, setStream] = useState<string | null>(null);

    const sendResponse = async (prompt: string, file?: File | null) => {
        const content: ContentBlock[] = [
            {
                text: prompt,
            },
        ];

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

        const apiResponse = await client.send(
            new ConverseStreamCommand({
                modelId: MODEL_ID,
                messages: [
                    ...history,
                    {
                        role: "user",
                        content,
                    },
                ],
                inferenceConfig: {
                    maxTokens: 512,
                    temperature: 0.5,
                    topP: 0.9,
                },
            })
        );

        return apiResponse;
    };

    const parseResponse = async (apiResponse: ConverseStreamCommandOutput) => {
        if (!apiResponse.stream) return "";

        let completeMessage = "";

        // Decode and process the response stream
        for await (const item of apiResponse.stream) {
            if (item.contentBlockDelta) {
                const text = item.contentBlockDelta.delta?.text;
                setStream(completeMessage + text);
                completeMessage = completeMessage + text;
            }
        }

        // Return the final response
        setStream(null);
        return completeMessage;
    };

    const addToHistory = (text: string, role: ConversationRole) => {
        setHistory((prev) => [...prev, { content: [{ text }], role }]);
    };

    const onSubmit = async (prompt: string, file?: File | null) => {
        addToHistory(prompt, USER_NAME);
        const response = await sendResponse(prompt, file);
        const parsedResponse = await parseResponse(response);
        addToHistory(parsedResponse, MODEL_NAME);
    };

    return (
        <div className="flex flex-col h-screen p-4">
            <div className="overflow-y-scroll flex-1">
                {history.map(({ role, content }) => (
                    <ChatMessage
                        key={content[0].text}
                        author={role}
                        reverse={role === USER_NAME}
                        text={content[0].text}
                    />
                ))}

                {stream && (
                    <ChatMessage
                        key={stream}
                        author={MODEL_NAME}
                        reverse={false}
                        text={stream}
                    />
                )}
            </div>

            <div className="flex items-center justify-between mt-auto h-20 sticky bottom-0 left-0 right-0">
                <ChatInput onSubmit={onSubmit} />
            </div>
        </div>
    );
}

export default App;
