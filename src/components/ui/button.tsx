import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { createRipple } from "@/lib/ripple";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"relative inline-flex items-center justify-center overflow-hidden whitespace-nowrap rounded-full select-none text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 before:absolute before:inset-0 before:rounded-full before:bg-black before:opacity-0 before:transition-opacity hover:before:opacity-[0.08] focus-visible:before:opacity-[0.12] active:before:opacity-[0.12] h-10 [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				elevated:
					"shadow-md bg-surface-container-low text-primary before:bg-primary",
				filled: "bg-primary text-on-primary before:bg-on-primary",
				tonal:
					"bg-secondary-container text-on-secondary-container before:bg-on-secondary-container",
				outlined:
					"border border-outline text-on-surface-variant before:bg-primary",
				text: "text-primary before:bg-primary",
			},
			size: {
				xs: "h-8 px-3 text-sm [&>svg]:size-5 [&>svg]:mr-1",
				sm: "h-10 px-4 text-sm [&>svg]:size-5 [&>svg]:mr-2",
				md: "h-14 px-6 text-base [&>svg]:size-6 [&>svg]:mr-2",
				lg: "h-24 px-12 text-2xl [&>svg]:size-8 [&>svg]:mr-3",
				xl: "h-34 px-16 text-[2rem] [&>svg]:size-10 [&>svg]:mr-4",
				icon: "size-10",
				fab: "size-14 hover:before:rounded-2xl rounded-2xl shadow-lg",
			},
		},
		defaultVariants: {
			variant: "elevated",
			size: "sm",
		},
	},
);

export interface ButtonProps
	extends React.ComponentProps<"button">,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

function Button({
	className,
	variant,
	size,
	asChild = false,
	...props
}: ButtonProps) {
	const Comp = asChild ? Slot : "button";

	return (
		<Comp
			className={cn(buttonVariants({ variant, size, className }))}
			onPointerDown={(e) => {
				createRipple(e.currentTarget, e);
			}}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
