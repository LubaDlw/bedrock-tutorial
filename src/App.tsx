import { useState } from "react";
import "./App.css";
import { ConversationRole } from "@aws-sdk/client-bedrock-runtime";
import {
    BedrockAgentRuntimeClient,
    InvokeAgentCommand,
    InvokeAgentCommandOutput,
} from "@aws-sdk/client-bedrock-agent-runtime";
import { ChatInput } from "./components/ChatInput/ChatInput";
import { ChatMessage } from "./components/ChatMessage/ChatMessage";

const AWS_REGION = "us-east-1";
const MODEL_NAME = "assistant";
const USER_NAME = "user";

const client = new BedrockAgentRuntimeClient({
    region: AWS_REGION,
    credentials: {
        accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY,
        secretAccessKey: import.meta.env.VITE_AWS_SECRET_KEY,
    },
});

interface IMessage {
    role: ConversationRole;
    content: { text: string }[];
}

function App() {
    const [history, setHistory] = useState<IMessage[]>([]);

    const [stream, setStream] = useState<string | null>(null);

    const sendResponse = async (prompt: string) => {
        const content: string = prompt;

        const apiResponse = await client.send(
            new InvokeAgentCommand({
                inputText: content,
                agentId: "IPYDCM4FPA",
                agentAliasId: "AM0UMXPNZP",
                sessionId: "123",
            })
        );

        return apiResponse;
    };

    const parseResponse = async (apiResponse: InvokeAgentCommandOutput) => {
        if (!apiResponse.completion) return "";

        let completeMessage = "";

        // Decode and process the response stream
        for await (const item of apiResponse.completion) {
            if (item.chunk) {
                const text = item.chunk;
                const decoded = new TextDecoder("utf-8").decode(text.bytes);

                setStream(completeMessage + decoded);
                completeMessage = completeMessage + decoded;
            }
        }

        // Return the final response
        setStream(null);
        return completeMessage;
    };

    const addToHistory = (text: string, role: ConversationRole) => {
        setHistory((prev) => [...prev, { content: [{ text }], role }]);
    };

    const onSubmit = async (prompt: string) => {
        addToHistory(prompt, USER_NAME);
        const response = await sendResponse(prompt);
        console.log({ response });
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
                        text={content[0].text || ""}
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
