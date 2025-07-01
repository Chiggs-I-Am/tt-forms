import Image from "next/image";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const chatMessageVariants = cva(
	"max-w-[85%] rounded-2xl px-4 py-3 text-sm break-words",
	{
		variants: {
			type: {
				bot: [
					"bg-surface-container text-on-surface",
					"rounded-tl-sm", // More rectangular corner for bot messages
				],
				user: [
					"bg-primary text-on-primary ml-auto",
					"rounded-tr-sm", // More rectangular corner for user messages
				],
			},
		},
		defaultVariants: {
			type: "bot",
		},
	}
);

export interface ChatMessageProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof chatMessageVariants> {
	content: string;
	timestamp?: Date;
	isTyping?: boolean;
	avatar?: string;
	showAvatar?: boolean;
}

export function ChatMessage({
	content,
	type = "bot",
	timestamp,
	isTyping = false,
	avatar,
	showAvatar = false,
	className,
	...props
}: ChatMessageProps) {
	const [displayedContent, setDisplayedContent] = React.useState("");
	const [isAnimating, setIsAnimating] = React.useState(isTyping);

	// Typing animation effect
	React.useEffect(() => {
		if (!isTyping) {
			setDisplayedContent(content);
			setIsAnimating(false);
			return;
		}

		setIsAnimating(true);
		setDisplayedContent("");

		let currentIndex = 0;
		const intervalId = setInterval(() => {
			if (currentIndex <= content.length) {
				setDisplayedContent(content.slice(0, currentIndex));
				currentIndex++;
			} else {
				setIsAnimating(false);
				clearInterval(intervalId);
			}
		}, 50); // Adjust speed as needed

		return () => clearInterval(intervalId);
	}, [content, isTyping]);

	return (
		<div
			className={cn(
				"flex items-end space-x-3 mb-4",
				type === "user" ? "flex-row-reverse space-x-reverse" : ""
			)}
			{...props}
		>
			{/* Avatar */}
			{showAvatar && (
				<div className="size-8 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
					{avatar ? (
												<Image
							src={avatar}
							alt={`${type} avatar`}
							width={32}
							height={32}
							className="size-8 rounded-full object-cover"
						/>
					) : (
						<div className="size-6 rounded-full bg-primary/20 flex items-center justify-center">
							{type === "bot" ? (
								<svg
									className="size-4 text-primary"
									fill="none"
									viewBox="0 0 24 24"
									strokeWidth={1.5}
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.847a4.5 4.5 0 003.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
									/>
								</svg>
							) : (
								<svg
									className="size-4 text-primary"
									fill="none"
									viewBox="0 0 24 24"
									strokeWidth={1.5}
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
									/>
								</svg>
							)}
						</div>
					)}
				</div>
			)}

			{/* Message Content */}
			<div
				className={cn(
					"flex flex-col",
					type === "user" ? "items-end" : "items-start"
				)}
			>
				<div className={cn(chatMessageVariants({ type }), className)}>
					{displayedContent}
					{isAnimating && (
						<span className="inline-block w-1 h-4 bg-current ml-1 animate-pulse" />
					)}
				</div>

				{/* Timestamp */}
				{timestamp && (
					<div
						className={cn(
							"text-xs text-on-surface-variant mt-1 px-2",
							type === "user" ? "text-right" : "text-left"
						)}
					>
						{timestamp.toLocaleTimeString([], {
							hour: "2-digit",
							minute: "2-digit",
						})}
					</div>
				)}
			</div>
		</div>
	);
}
