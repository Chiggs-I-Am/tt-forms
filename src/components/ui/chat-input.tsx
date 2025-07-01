import { cn } from "@/lib/utils";
import * as React from "react";
import { Button } from "./button";

export interface ChatInputProps {
	onSendMessage: (message: string) => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
	maxLength?: number;
}

export function ChatInput({
	onSendMessage,
	placeholder = "Type your message...",
	disabled = false,
	className,
	maxLength = 500,
}: ChatInputProps) {
	const [message, setMessage] = React.useState("");
	const textareaRef = React.useRef<HTMLTextAreaElement>(null);

	const handleSubmit = React.useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			if (message.trim() && !disabled) {
				onSendMessage(message.trim());
				setMessage("");
				// Reset textarea height
				if (textareaRef.current) {
					textareaRef.current.style.height = "auto";
				}
			}
		},
		[message, disabled, onSendMessage]
	);

	const handleKeyDown = React.useCallback(
		(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				handleSubmit(e);
			}
		},
		[handleSubmit]
	);

	// Auto-resize textarea
	React.useEffect(() => {
		const textarea = textareaRef.current;
		if (textarea) {
			textarea.style.height = "auto";
			textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
		}
	}, [message]);

	const canSend = message.trim().length > 0 && !disabled;

	return (
		<div className={cn(
			"min-w-[280px] max-w-full w-full",
			className
		)}>
			<form onSubmit={handleSubmit}>
				<div className="grid grid-cols-[1fr_auto] gap-1 sm:gap-2 items-center w-full max-w-full min-w-0 box-border">
					{/* Message Input */}
					<textarea
						ref={textareaRef}
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder={placeholder}
						disabled={disabled}
						maxLength={maxLength}
						rows={1}
						className={cn(
							"w-full max-w-full min-w-0 box-border resize-none rounded-xl px-2 py-2",
							"bg-surface-container text-on-surface placeholder:text-on-surface-variant",
							"border border-outline",
							"hover:border-on-surface focus:border-primary focus:border-2",
							"focus:outline-none focus:bg-surface",
							"disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-variant disabled:border-outline-variant",
							"text-sm leading-5 min-h-[40px] max-h-[120px]",
							"transition-all duration-200 ease-standard",
							"scrollbar-none overflow-y-auto"
						)}
						style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
					/>

					{/* Send Button */}
					<Button
						type="submit"
						variant="filled"
						size="icon"
						disabled={!canSend}
						className={cn(
							"size-10 rounded-full transition-all duration-200 ease-standard min-w-0 box-border",
							!canSend && "bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-highest"
						)}
					>
						<svg
							className="size-5"
							fill="none"
							viewBox="0 0 24 24"
							strokeWidth={1.5}
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
							/>
						</svg>
						<span className="sr-only">Send message</span>
					</Button>
				</div>
			</form>
		</div>
	);
}
