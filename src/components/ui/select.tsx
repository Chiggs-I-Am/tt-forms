import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown, ChevronUp } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

export const Select = SelectPrimitive.Root;

export const SelectGroup = SelectPrimitive.Group;

export const SelectValue = SelectPrimitive.Value;

export function SelectTrigger({ 
	className, 
	children, 
	variant = "filled", 
	...props 
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
	variant?: "filled" | "outlined";
}) {
	return (
		<SelectPrimitive.Trigger
			className={cn(
				"flex h-14 w-full items-center justify-between bg-transparent px-4 text-base text-on-surface focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-40 [&>span]:line-clamp-1",
				variant === "filled" &&
					"rounded-t border-b border-on-surface-variant bg-surface-container-highest hover:border-on-surface hover:bg-on-surface/[0.08] focus:border-b-2 focus:border-primary data-[state=open]:border-b-2 data-[state=open]:border-primary",
				variant === "outlined" &&
					"rounded border border-outline bg-surface hover:border-on-surface focus:border-2 focus:border-primary data-[state=open]:border-2 data-[state=open]:border-primary",
				className
			)}
			{...props}
		>
			{children}
			<SelectPrimitive.Icon asChild>
				<ChevronDown className="h-6 w-6 opacity-60 transition-transform data-[state=open]:rotate-180" />
			</SelectPrimitive.Icon>
		</SelectPrimitive.Trigger>
	);
}

export function SelectScrollUpButton({ 
	className, 
	...props 
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
	return (
		<SelectPrimitive.ScrollUpButton
			className={cn(
				"flex cursor-default items-center justify-center py-1",
				className
			)}
			{...props}
		>
			<ChevronUp className="h-4 w-4" />
		</SelectPrimitive.ScrollUpButton>
	);
}

export function SelectScrollDownButton({ 
	className, 
	...props 
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
	return (
		<SelectPrimitive.ScrollDownButton
			className={cn(
				"flex cursor-default items-center justify-center py-1",
				className
			)}
			{...props}
		>
			<ChevronDown className="h-4 w-4" />
		</SelectPrimitive.ScrollDownButton>
	);
}

export function SelectContent({ 
	className, 
	children, 
	position = "popper", 
	...props 
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
	return (
		<SelectPrimitive.Portal>
			<SelectPrimitive.Content
				className={cn(
					"relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded bg-surface-container border border-outline-variant text-on-surface shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
					position === "popper" &&
						"data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
					className
				)}
				position={position}
				{...props}
			>
				<SelectScrollUpButton />
				<SelectPrimitive.Viewport
					className={cn(
						position === "popper" &&
							"h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
					)}
				>
					{children}
				</SelectPrimitive.Viewport>
				<SelectScrollDownButton />
			</SelectPrimitive.Content>
		</SelectPrimitive.Portal>
	);
}

export function SelectLabel({ 
	className, 
	...props 
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
	return (
		<SelectPrimitive.Label
			className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold text-on-surface-variant", className)}
			{...props}
		/>
	);
}

export function SelectItem({ 
	className, 
	children, 
	...props 
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
	return (
		<SelectPrimitive.Item
			className={cn(
				"relative flex w-full cursor-pointer select-none items-center py-3 px-6 text-base text-on-surface outline-none hover:bg-on-surface/[0.08] focus:bg-on-surface/[0.08] data-[disabled]:pointer-events-none data-[disabled]:opacity-38",
				"data-[state=checked]:bg-secondary-container data-[state=checked]:text-on-secondary-container data-[state=checked]:font-medium",
				className
			)}
			{...props}
		>
			<SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
		</SelectPrimitive.Item>
	);
}

export function SelectSeparator({ 
	className, 
	...props 
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
	return (
		<SelectPrimitive.Separator
			className={cn("-mx-1 my-1 h-px bg-outline-variant", className)}
			{...props}
		/>
	);
}

// Custom wrapper component for Material Design floating label
interface SelectFieldProps {
	label?: string;
	variant?: "filled" | "outlined";
	children?: React.ReactNode;
	value?: string;
	onValueChange?: (value: string) => void;
	disabled?: boolean;
	className?: string;
}

export function SelectField({ 
	label, 
	variant = "filled", 
	children, 
	className, 
	...props 
}: SelectFieldProps) {
	const id = React.useId();
	const [hasValue, setHasValue] = React.useState(!!props.value);

	return (
		<div className={cn("group relative w-full min-w-[180px]", className)}>
			<Select
				{...props}
				onValueChange={(value: string) => {
					setHasValue(!!value);
					props.onValueChange?.(value);
				}}
			>
				<SelectTrigger
					variant={variant}
					id={id}
					className={cn(
						"peer h-14",
						label && variant === "filled" && "pt-6 pb-2",
						label && variant === "outlined" && "pt-4 pb-4"
					)}
					aria-labelledby={label ? `${id}-label` : undefined}
				>
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{children}
				</SelectContent>
			</Select>
			{label && (
				<label
					id={`${id}-label`}
					className={cn(
						"pointer-events-none absolute left-4 origin-top-left text-base text-on-surface-variant transition-all duration-150 ease-out",
						// Filled variant label positioning
						variant === "filled" && [
							"top-2 -translate-y-0 scale-75 text-xs",
							"group-focus-within:text-primary",
							"peer-data-[state=open]:text-primary",
							!hasValue && "top-1/2 -translate-y-1/2 scale-100 text-base"
						],
						// Outlined variant label positioning
						variant === "outlined" && [
							"top-1 -translate-y-1/2 scale-75 bg-surface px-1 text-xs",
							"group-focus-within:text-primary",
							"peer-data-[state=open]:text-primary",
							!hasValue && "top-1/2 -translate-y-1/2 scale-100 bg-transparent px-0 text-base"
						]
					)}
				>
					{label}
				</label>
			)}
		</div>
	);
}

