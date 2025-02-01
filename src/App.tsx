import { useState } from "react";
import "./App.css";
import { ConversationRole } from "@aws-sdk/client-bedrock-runtime";
import {
    BedrockAgentRuntimeClient,
    CitationEvent,
    RetrieveAndGenerateStreamCommand,
    RetrieveAndGenerateStreamResponse,
} from "@aws-sdk/client-bedrock-agent-runtime";
import { ChatInput } from "./components/ChatInput/ChatInput";
import { ChatMessage } from "./components/ChatMessage/ChatMessage";

const AWS_REGION = "us-east-1";
const MODEL_ID = "anthropic.claude-3-haiku-20240307-v1:0";
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
    references?: CitationEvent[];
}

function App() {
    const [history, setHistory] = useState<IMessage[]>([]);

    const [stream, setStream] = useState<string | null>(null);

    const sendResponse = async (prompt: string) => {
        const content: string = prompt;

        const apiResponse = await client.send(
            new RetrieveAndGenerateStreamCommand({
                input: {
                    text: content,
                },
                retrieveAndGenerateConfiguration: {
                    type: "KNOWLEDGE_BASE",
                    knowledgeBaseConfiguration: {
                        knowledgeBaseId: "3J7YHPSERN",
                        modelArn: MODEL_ID,
                        retrievalConfiguration: {
                            vectorSearchConfiguration: {
                                numberOfResults: 5,
                            },
                        },
                    },
                },
            })
        );

        return apiResponse;
    };

    const parseResponse = async (
        apiResponse: RetrieveAndGenerateStreamResponse
    ) => {
        if (!apiResponse.stream) return { response: "" };

        let completeMessage = "";
        const citations = [];

        // Decode and process the response stream
        for await (const item of apiResponse.stream) {
            if (item.output) {
                const text = item.output.text;
                setStream(completeMessage + text);
                completeMessage = completeMessage + text;
            }

            if (item.citation) {
                const citation = item.citation;
                citations.push(citation);
            }
        }

        // Return the final response
        setStream(null);
        return { response: completeMessage, citations };
    };

    const addToHistory = (
        text: string,
        role: ConversationRole,
        references?: CitationEvent[]
    ) => {
        setHistory((prev) => [
            ...prev,
            { content: [{ text }], role, references },
        ]);
    };

    const onSubmit = async (prompt: string) => {
        addToHistory(prompt, USER_NAME);
        const response = await sendResponse(prompt);
        const parsedResponse = await parseResponse(response);
        addToHistory(
            parsedResponse.response,
            MODEL_NAME,
            parsedResponse.citations
        );
    };

    return (
        <div className="flex flex-col h-screen p-4">
            <div className="overflow-y-scroll flex-1">
                {history.map(({ role, content, references }) => (
                    <ChatMessage
                        key={content[0].text}
                        author={role}
                        reverse={role === USER_NAME}
                        text={content[0].text || ""}
                        references={references}
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
