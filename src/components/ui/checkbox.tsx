import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

export function Checkbox({
	className,
	...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
	return (
		<CheckboxPrimitive.Root
			className={cn(
				// Touch target - 48px minimum for accessibility
				"group inline-flex items-center justify-center size-12 shrink-0 transition-all duration-200",
				// Cursor and positioning
				"cursor-pointer relative rounded-full",
				// Focus state for the entire touch area - MD3 focus ring (matches state layer)
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
				// Disabled state
				"disabled:cursor-not-allowed",
				className
			)}
			{...props}
		>
			{/* 40px State Layer with Ripple */}
			<div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden rounded-full">
				<div className="size-10 rounded-full transition-all duration-200 group-hover:bg-primary/[0.08] group-active:bg-primary/[0.12] group-disabled:bg-transparent" />
				{/* Ripple Effect */}
				<div className="absolute inset-0 rounded-full opacity-0 bg-primary/[0.12] group-active:opacity-100 group-active:animate-ripple-press group-active:scale-100 scale-0 transition-opacity duration-150" />
			</div>
			
			{/* Visual Checkbox */}
			<div
				className={cn(
					// Visual checkbox styles - 18px
					"size-[18px] rounded-sm relative z-10 pointer-events-none",
					// MD3 Default state - Unselected (transparent background per MD3 spec)
					"border-2 border-outline bg-transparent",
					// Background transition - Material Web timing: 350ms enter, 150ms exit
					"transition-[background-color,border-color]",
					"duration-[350ms] ease-[cubic-bezier(0.05,0.7,0.1,1)]", // emphasized-decelerate for enter
					"group-data-[state=unchecked]:duration-150 group-data-[state=unchecked]:ease-[cubic-bezier(0.3,0,0.8,0.15)]", // emphasized-accelerate for exit
					// MD3 Checked state
					"group-data-[state=checked]:bg-primary group-data-[state=checked]:border-primary",
					// MD3 Disabled states - unchecked disabled keeps transparent background
					"group-disabled:border-on-surface/[0.38] group-disabled:bg-transparent",
					"group-data-[state=checked]:group-disabled:bg-on-surface/[0.38] group-data-[state=checked]:group-disabled:border-on-surface/[0.38]",
					// MD3 Indeterminate state
					"group-data-[state=indeterminate]:bg-primary group-data-[state=indeterminate]:border-primary"
				)}
			>
				<CheckboxPrimitive.Indicator className={cn(
					"flex items-center justify-center",
					// MD3 Checkmark colors
					"text-on-primary group-data-[state=checked]:text-on-primary",
					"group-data-[state=indeterminate]:text-on-primary",
					"group-disabled:text-on-surface/[0.38]",
					// Material Web animation - scale from 0.6 to 1 (matching MD spec)
					"scale-[0.6] opacity-0",
					"group-data-[state=checked]:scale-100 group-data-[state=checked]:opacity-100",
					"group-data-[state=indeterminate]:scale-100 group-data-[state=indeterminate]:opacity-100",
					// Material Web timing: 350ms enter (emphasized-decelerate), 150ms exit (emphasized-accelerate)
					"transition-[transform,opacity]",
					"duration-[350ms] ease-[cubic-bezier(0.05,0.7,0.1,1)]", // emphasized-decelerate for enter
					"group-data-[state=unchecked]:duration-150 group-data-[state=unchecked]:ease-[cubic-bezier(0.3,0,0.8,0.15)]" // emphasized-accelerate for exit
				)}>
					<CheckIcon className="h-4 w-4 stroke-[2.5]" />
				</CheckboxPrimitive.Indicator>
			</div>
		</CheckboxPrimitive.Root>
	);
}
