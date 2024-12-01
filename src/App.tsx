import { useState } from "react";
import "./App.css";
import {
    BedrockRuntimeClient,
    InvokeModelWithResponseStreamCommand,
    InvokeModelWithResponseStreamCommandOutput,
} from "@aws-sdk/client-bedrock-runtime";
import { ChatInput } from "./components/ChatInput/ChatInput";
import { ChatMessage } from "./components/ChatMessage/ChatMessage";

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
    role: string;
    content: { type: string; text: string }[];
}

function App() {
    const [history, setHistory] = useState<IMessage[]>([]);

    const [stream, setStream] = useState<string | null>(null);

    const sendResponse = async (prompt: string) => {
        const payload = {
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: 1000,
            messages: [
                ...history,
                { role: "user", content: [{ type: "text", text: prompt }] },
            ],
        };

        const apiResponse = await client.send(
            new InvokeModelWithResponseStreamCommand({
                contentType: "application/json",
                body: JSON.stringify(payload),
                modelId: MODEL_ID,
            })
        );

        return apiResponse;
    };

    const parseResponse = async (
        apiResponse: InvokeModelWithResponseStreamCommandOutput
    ) => {
        if (!apiResponse.body) return "";

        let completeMessage = "";

        // Decode and process the response stream
        for await (const item of apiResponse.body) {
            /** @type Chunk */
            const chunk = JSON.parse(
                new TextDecoder().decode(item.chunk?.bytes)
            );
            const chunk_type = chunk.type;

            if (chunk_type === "content_block_delta") {
                const text = chunk.delta.text;
                setStream(completeMessage + text);
                completeMessage = completeMessage + text;
            }
        }

        // Return the final response
        setStream(null);
        return completeMessage;
    };

    const addToHistory = (text: string, role: string) => {
        setHistory((prev) => [
            ...prev,
            { content: [{ type: "text", text }], role },
        ]);
    };

    const onSubmit = async (prompt: string) => {
        addToHistory(prompt, USER_NAME);
        const response = await sendResponse(prompt);
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
