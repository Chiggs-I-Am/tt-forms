import { Form } from "./form";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { ChatInput } from "./chat-input";
import { ChatMessage } from "./chat-message";
import { Progress } from "./progress";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Path } from "react-hook-form";
import { useCallback, useEffect, useRef, useState } from "react";

export interface FormStep<TFormSchema extends z.AnyZodObject = z.AnyZodObject> {
	id: Path<z.infer<TFormSchema>>;
	title: string;
	description?: string;
	question: string;
	type: "text" | "number" | "email" | "select" | "checkbox" | "radio";
	options?: string[];
	required?: boolean;
	
}

export interface ConversationalMessage {
	id: string;
	type: "bot" | "user";
	content: string;
	timestamp: Date;
	stepId?: string;
}

export interface ConversationalFormProps<T extends z.AnyZodObject = z.AnyZodObject> {
	steps: FormStep<T>[];
	onComplete: (formData: z.infer<T>) => void;
	onStepChange?: (currentStep: number) => void;
	title?: string;
	description?: string;
	className?: string;
	formSchema: T;
}


export function ConversationalForm<T extends z.AnyZodObject>({
	steps,
	onComplete,
	onStepChange,
	title = "Complete Your Form",
	description = "Let's walk through this step by step",
	className,
	formSchema,
}: ConversationalFormProps<T>) {
	const methods = useForm<z.infer<T>>({
		resolver: zodResolver(formSchema),
		mode: "onChange",
	});

	const { control, getValues, trigger, formState: { errors } } = methods;
	const [currentStep, setCurrentStep] = useState(1);
	const [messages, setMessages] = useState<ConversationalMessage[]>([]);
	const [isAwaitingResponse, setIsAwaitingResponse] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	// Initialize with welcome message and first question
	useEffect(() => {
		const welcomeMessage: ConversationalMessage = {
			id: "welcome",
			type: "bot",
			content: `Hello! ${description}. Let's start with the first question.`,
			timestamp: new Date(),
		};

		const firstQuestionMessage: ConversationalMessage = {
			id: `question-${steps[0]?.id}`,
			type: "bot",
			content: steps[0]?.question || "No questions available.",
			timestamp: new Date(),
			stepId: steps[0]?.id,
		};

		setMessages([welcomeMessage, firstQuestionMessage]);
		setIsAwaitingResponse(true);
	}, [description, steps]);

	// Scroll to bottom when new messages are added
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	// Notify parent of step changes
	useEffect(() => {
		onStepChange?.(currentStep);
	}, [currentStep, onStepChange]);

	const handleUserMessage = useCallback(
		async (messageContent: string) => {
			if (!isAwaitingResponse) return;

			const currentStepData = steps[currentStep - 1];
			if (!currentStepData) return;

			// Add user message
			const userMessage: ConversationalMessage = {
				id: `user-${Date.now()}`,
				type: "user",
				content: messageContent,
				timestamp: new Date(),
				stepId: currentStepData.id,
			};

			setMessages((prev) => [...prev, userMessage]);
			setIsAwaitingResponse(false);

			// Set value and trigger validation for the current field
			const isValid = await trigger(currentStepData.id);

			if (!isValid) {
				const errorMessage: ConversationalMessage = {
					id: `error-${Date.now()}`,
					type: "bot",
					content: `${errors[currentStepData.id]?.message || "Invalid input."}
						Please try again.`,
					timestamp: new Date(),
				};

				setTimeout(() => {
					setMessages((prev) => [...prev, errorMessage]);
					setIsAwaitingResponse(true);
				}, 1000);

				return;
			}

			// Check if this is the last step
			if (currentStep >= steps.length) {
				// Form complete
				const completionMessage: ConversationalMessage = {
					id: `completion-${Date.now()}`,
					type: "bot",
					content: "Perfect! Thank you for completing the form. Let me process your information...",
					timestamp: new Date(),
				};

				setTimeout(() => {
					setMessages((prev) => [...prev, completionMessage]);
					setTimeout(() => {
						onComplete(getValues());
					}, 1500);
				}, 1000);

				return;
			}

			// Move to next step
			const nextStep = currentStep + 1;
			const nextStepData = steps[nextStep - 1];

			if (nextStepData) {
				const acknowledgmentMessage: ConversationalMessage = {
					id: `ack-${Date.now()}`,
					type: "bot",
					content: "Got it! Let's continue.",
					timestamp: new Date(),
				};

				const nextQuestionMessage: ConversationalMessage = {
					id: `question-${nextStepData.id}`,
					type: "bot",
					content: nextStepData.question,
					timestamp: new Date(),
					stepId: nextStepData.id,
				};

				setTimeout(() => {
					setMessages((prev) => [...prev, acknowledgmentMessage]);
					setTimeout(() => {
						setMessages((prev) => [...prev, nextQuestionMessage]);
						setCurrentStep(nextStep);
						setIsAwaitingResponse(true);
					}, 800);
				}, 1000);
			}
		},
		[currentStep, steps, errors, isAwaitingResponse, onComplete, trigger, getValues]
	);

	const handleGoBack = useCallback(() => {
		if (currentStep > 1) {
			const previousStep = currentStep - 1;
			const previousStepData = steps[previousStep - 1];

			if (previousStepData) {
				const backMessage: ConversationalMessage = {
					id: `back-${Date.now()}`,
					type: "bot",
					content: `Let's go back to the previous question: ${previousStepData.question}`,
					timestamp: new Date(),
					stepId: previousStepData.id,
				};

				setMessages((prev) => [...prev, backMessage]);
				setCurrentStep(previousStep);
				setIsAwaitingResponse(true);
			}
		}
			}, [currentStep, steps]);

	const handleReset = useCallback(() => {
		setCurrentStep(1);
		methods.reset(); // Reset form fields using react-hook-form's reset
		setIsAwaitingResponse(false);

		const resetMessage: ConversationalMessage = {
			id: `reset-${Date.now()}`,
			type: "bot",
			content: "Let's start over. Here's the first question again:",
			timestamp: new Date(),
		};

		const firstQuestionMessage: ConversationalMessage = {
			id: `question-reset-${steps[0]?.id}`,
			type: "bot",
			content: steps[0]?.question || "No questions available.",
			timestamp: new Date(),
			stepId: steps[0]?.id,
		};

		setMessages([resetMessage, firstQuestionMessage]);
		setTimeout(() => {
			setIsAwaitingResponse(true);
		}, 500);
		}, [steps, methods]);

	return (
		<Form {...methods}>
			<div className={cn("flex flex-col h-full bg-background", className)}>
			{/* Header */}
			<div className="shrink-0 p-4 border-b border-outline-variant bg-surface">
				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-lg font-semibold text-on-surface">{title}</h2>
						<p className="text-sm text-on-surface-variant">{description}</p>
					</div>
					<div className="flex space-x-2">
						<Button
							variant="text"
							size="xs"
							onClick={handleGoBack}
							disabled={currentStep <= 1}
						>
							Back
						</Button>
						<Button variant="text" size="xs" onClick={handleReset}>
							Reset
						</Button>
					</div>
				</div>

				{/* Progress Indicator */}
				<div className="mt-4">
					<Progress
						value={(currentStep / steps.length) * 100}
					/>
				</div>
			</div>

			{/* Messages */}
			<div className="flex-1 overflow-y-auto p-4 space-y-4">
				{messages.map((message) => (
					<ChatMessage
						key={message.id}
						type={message.type}
						content={message.content}
						timestamp={message.timestamp}
						isTyping={message.type === "bot" && message === messages[messages.length - 1]}
						showAvatar={true}
					/>
				))}
				<div ref={messagesEndRef} />
			</div>

			{/* Input */}
			<div className="shrink-0">
				<Controller
					name={steps[currentStep - 1]?.id}
					control={control}
					render={({ field }) => (
						<ChatInput
							onSendMessage={(message) => {
								field.onChange(message);
								handleUserMessage(message);
							}}
							disabled={!isAwaitingResponse}
							placeholder={
								isAwaitingResponse
									? "Type your answer..."
									: "Please wait for the next question..."
							}
						/>
					)}
				/>
			</div>
		</div>
		</Form>
	);
}