import { cn } from "@/lib/utils";
import * as React from "react";

export function MaxWidthWrapper({
	className,
	children,
}: {
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<div
			className={cn(
				"@container w-full max-w-full @sm:max-w-screen-sm @md:max-w-screen-md @lg:max-w-screen-lg @xl:max-w-screen-xl @2xl:max-w-screen-2xl px-6 @sm:px-4 @md:px-8 @lg:px-12 @xl:px-20 mx-auto",
				className
			)}
		>
			{children}
		</div>
	);
}
