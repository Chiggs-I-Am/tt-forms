import useJoinClassNames from "@utils/joinClasses";

type MessageType = "bot" | "user";

interface ChatMessageProps {
  type: MessageType;
  content: string;
  timestamp?: Date;
  isTyping?: boolean;
}

export default function ChatMessage({ type, content, timestamp, isTyping = false }: ChatMessageProps) {
  const joinClassNames = useJoinClassNames();

  return (
    <div className={joinClassNames(
      "flex mb-4",
      type === "user" ? "justify-end" : "justify-start"
    )}>
      <div className={joinClassNames(
        "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
        type === "user" 
          ? "bg-blue-500 text-white rounded-br-none" 
          : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none"
      )}>
        {isTyping ? (
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
          </div>
        ) : (
          <p className="text-sm">{content}</p>
        )}
        {timestamp && !isTyping && (
          <p className={joinClassNames(
            "text-xs mt-1 opacity-70",
            type === "user" ? "text-right" : "text-left"
          )}>
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  );
}