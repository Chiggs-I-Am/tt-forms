import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const inputVariants = cva(
	"peer w-full text-base text-on-surface transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40",
	{
		variants: {
			variant: {			
				filled:
				"h-14 rounded-t-lg border-b bg-surface-container-highest px-4 pb-2 pt-6 border-on-surface-variant placeholder-transparent hover:bg-on-surface/[0.08] focus-visible:border-b-2 focus-visible:border-primary",
				outlined:
					"h-14 rounded-lg border border-outline bg-surface px-4 placeholder-transparent hover:border-on-surface focus-visible:border-2 focus-visible:border-primary",
			},
		},
		defaultVariants: {
			variant: "filled",
		},
	},
);

export interface InputProps
	extends React.ComponentProps<"input">,
		VariantProps<typeof inputVariants> {
	label: string;
}

export function Input({ className, variant, type, label, id: propId, ...props }: InputProps) {
	const generatedId = React.useId();
	const id = propId ?? generatedId;

	if (variant === "outlined") {
		return (
			<div className="group relative">
				<input
					id={id}
					type={type}
					className={cn(inputVariants({ variant, className }))}
					placeholder=" "
					{...props}
				/>
				<label
					htmlFor={id}
					className={cn(
						"pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 origin-top-left text-base text-on-surface-variant transition-all",
						"group-focus-within:top-0 group-focus-within:-translate-y-[0.5rem] group-focus-within:scale-75 group-focus-within:bg-surface group-focus-within:px-1 group-focus-within:text-primary",
						"peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-[0.375rem] peer-[:not(:placeholder-shown)]:scale-75 peer-[:not(:placeholder-shown)]:bg-surface peer-[:not(:placeholder-shown)]:px-1",
					)}
				>
					{label}
				</label>
			</div>
		);
	}

	// Filled variant with floating label
	return (
		<div className="group relative">
			<input
				id={id}
				type={type}
				className={cn(inputVariants({ variant, className }))}
				placeholder=" "
				{...props}
			/>
			<label
				htmlFor={id}
				className={cn(
					"pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 origin-top-left text-base text-on-surface-variant transition-all",
					"group-focus-within:top-2 group-focus-within:-translate-y-0 group-focus-within:scale-75 group-focus-within:text-primary",
					"peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:-translate-y-0 peer-[:not(:placeholder-shown)]:scale-75",
				)}
			>
				{label}
			</label>
		</div>
	);
}
