import { useState } from "react";
import "./App.css";
import {
    BedrockRuntimeClient,
    InvokeModelCommand,
    InvokeModelCommandOutput,
} from "@aws-sdk/client-bedrock-runtime";
import { ChatInput } from "./components/ChatInput/ChatInput";
import { ChatMessage } from "./components/ChatMessage/ChatMessage";

const AWS_REGION = "us-east-1";
const MODEL_ID = "anthropic.claude-3-haiku-20240307-v1:0";
const MODEL_NAME = "Claude";
const USER_NAME = "User";

const client = new BedrockRuntimeClient({
    region: AWS_REGION,
    credentials: {
        accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY,
        secretAccessKey: import.meta.env.VITE_AWS_SECRET_KEY,
    },
});

function App() {
    const [history, setHistory] = useState<{ author: string; text: string }[]>([
        { author: USER_NAME, text: "Hello!" },
        { author: MODEL_NAME, text: "How can I help you?" },
    ]);

    const sendResponse = async (prompt: string) => {
        const payload = {
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: 1000,
            messages: [
                { role: "user", content: [{ type: "text", text: prompt }] },
            ],
        };

        const apiResponse = await client.send(
            new InvokeModelCommand({
                contentType: "application/json",
                body: JSON.stringify(payload),
                modelId: MODEL_ID,
            })
        );

        return apiResponse;
    };

    const parseResponse = (response: InvokeModelCommandOutput) => {
        const decodedResponseBody = new TextDecoder().decode(response.body);
        const responseBody = JSON.parse(decodedResponseBody);
        const responses = responseBody.content;

        if (responses.length === 1) {
            console.log(`Response: ${responses[0].text}`);
        } else {
            console.log("Haiku returned multiple responses:");
            console.log(responses);
        }
        return responses[0].text;
    };

    const addToHistory = (text: string, author: string) => {
        setHistory((prev) => [...prev, { text, author }]);
    };

    const onSubmit = async (prompt: string) => {
        addToHistory(prompt, USER_NAME);
        const response = await sendResponse(prompt);
        const parsedResponse = parseResponse(response);
        addToHistory(parsedResponse, MODEL_NAME);
    };

    return (
        <div className="flex flex-col h-screen p-4">
            <div className="overflow-y-scroll flex-1">
                {history.map(({ author, text }) => (
                    <ChatMessage
                        key={text}
                        author={author}
                        reverse={author === USER_NAME}
                        text={text}
                    />
                ))}
            </div>

            <div className="flex items-center justify-between mt-auto h-20 sticky bottom-0 left-0 right-0">
                <ChatInput onSubmit={onSubmit} />
            </div>
        </div>
    );
}

export default App;
