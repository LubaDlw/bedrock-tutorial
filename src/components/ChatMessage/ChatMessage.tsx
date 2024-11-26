interface ChatMessageProps {
    text: string;
    author: string;
    reverse?: boolean;
}

const borderRadiusClasses = "rounded-e-xl rounded-es-xl";
const borderRadiusClassesReverse = "rounded-s-xl rounded-ee-xl";

export const ChatMessage = ({
    text,
    author,
    reverse = false,
}: ChatMessageProps) => {
    return (
        <div
            className={`flex items-start gap-2.5 ${
                reverse ? "flex-row-reverse " : null
            }`}
        >
            <div className="w-8 h-8 rounded-full dark:bg-gray-700 border-gray-200 bg-gray-100 p-1">
                {author?.slice(0, 1).toUpperCase()}
            </div>
            <div
                className={`flex flex-col w-full max-w-[800px] leading-1.5 p-4 border-gray-200 bg-gray-100 ${
                    reverse ? borderRadiusClassesReverse : borderRadiusClasses
                } dark:bg-gray-700 mb-4 text-left`}
            >
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {author}
                    </span>
                    {/* <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                            11:46
                        </span> */}
                </div>
                <p className="text-sm font-normal py-2.5 text-gray-900 dark:text-white whitespace-pre-line ">
                    {text}
                </p>
            </div>
        </div>
    );
};
