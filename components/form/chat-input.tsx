import { PaperAirplaneIcon } from "@heroicons/react/solid";
import useJoinClassNames from "@utils/joinClasses";
import { useState, KeyboardEvent } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
  multiline?: boolean;
}

export default function ChatInput({ 
  onSend, 
  placeholder = "Type your message...", 
  disabled = false,
  multiline = false 
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const joinClassNames = useJoinClassNames();

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !multiline) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end space-x-2 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="flex-1">
        {multiline ? (
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            rows={3}
            className={joinClassNames(
              "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg",
              "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "resize-none"
            )}
          />
        ) : (
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            className={joinClassNames(
              "w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg",
              "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          />
        )}
      </div>
      <button
        onClick={handleSend}
        disabled={!message.trim() || disabled}
        className={joinClassNames(
          "p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-500",
          "transition-colors duration-200"
        )}
      >
        <PaperAirplaneIcon className="w-5 h-5 transform rotate-90" />
      </button>
    </div>
  );
}