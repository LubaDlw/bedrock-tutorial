import { ChangeEvent, useState } from "react";
const PROMPT = "Hi. In a short paragraph, explain what you can do.";

interface ChatInputProps {
    onSubmit: (prompt: string) => void;
}

export const ChatInput = ({ onSubmit }: ChatInputProps) => {
    const [value, setValue] = useState<string>(PROMPT);
    const onChange = (e: ChangeEvent<HTMLInputElement>) =>
        setValue(e.target.value);

    const submit = () => {
        onSubmit(value);
        setValue("");
    };

    return (
        <div className="flex items-end w-full">
            <div className="flex-auto">
                <input
                    value={value}
                    onChange={onChange}
                    id="large-input"
                    className="block w-full p-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-base focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                />
            </div>
            <div className="flex-none pl-2">
                <button
                    onClick={submit}
                    type="submit"
                    className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                    Submit
                </button>
            </div>
        </div>
    );
};
