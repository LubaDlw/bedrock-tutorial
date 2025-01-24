import { Tool } from "@aws-sdk/client-bedrock-runtime";

export const toolsSchema: Tool[] = [
    {
        toolSpec: {
            name: "sumOfTwoNumbers",
            inputSchema: {
                json: {
                    type: "object",
                    properties: {
                        x: {
                            type: "number",
                            description: "First number to add",
                        },
                        y: {
                            type: "number",
                            description: "Second number to add",
                        },
                    },
                    required: ["x", "y"],
                },
            },
        },
    },
    {
        toolSpec: {
            name: "getCurrencyRates",
            inputSchema: {
                json: {
                    type: "object",
                    properties: {
                        baseCurrency: {
                            type: "string",
                            description:
                                "The base currency we want to get rates for",
                        },
                    },
                    required: ["baseCurrency"],
                },
            },
        },
    },
];
