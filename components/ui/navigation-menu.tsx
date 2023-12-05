"use client"

import { joinClasses } from "@/utils/joinClasses";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu";
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from "react";

export const NavigationMenu = forwardRef<
	ElementRef<typeof NavigationMenuPrimitive.Root>,
	ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>
>(function NavigationMenu({ className, ...props }, ref) {
	return (
		<NavigationMenuPrimitive.Root
			ref={ref}
			className={joinClasses("relative z-10 flex w-screen h-16 justify-center", className)}
			{...props}
		/>
	);
});

export const NavigationMenuViewport = forwardRef<
	ElementRef<typeof NavigationMenuPrimitive.Viewport>,
	ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Viewport>
>(function NavigationMenuViewport({ className, ...props }, ref) {
	return (
		<NavigationMenuPrimitive.Viewport
			ref={ref}
			className={joinClasses(className)}
			{...props}
		/>
	);
});

export const NavigationMenuList = forwardRef<
	ElementRef<typeof NavigationMenuPrimitive.NavigationMenuList>,
	ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.NavigationMenuList>
>(function NavigationMenuList({ className, ...props }, ref) {
	return <ul ref={ref} className={joinClasses(className)} {...props} />;
});

export const NavigationMenuItem = NavigationMenuPrimitive.Item;
export const NavigationMenuLink = NavigationMenuPrimitive.Link;

export const NavigationMenuTrigger = forwardRef<
	ElementRef<typeof NavigationMenuPrimitive.Trigger>,
	ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>
>(function NavigationMenuTrigger({ children, className, ...props }, ref) {
	return (
		<NavigationMenuPrimitive.Trigger
			ref={ref}
			className={joinClasses(className)}
			{...props}
		>
			{children} <ChevronDownIcon className="w-6 h-6" />
		</NavigationMenuPrimitive.Trigger>
	);
});

export const NavigationMenuContent = forwardRef<
	ElementRef<typeof NavigationMenuPrimitive.Content>,
	ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>
>(function NavigationMenuContent({ className, ...props }, ref) {
	return (
		<NavigationMenuPrimitive.Content
			ref={ref}
			className={joinClasses(className)}
			{...props}
		/>
	);
});

export const NavigationMenuIndicator = forwardRef<
	ElementRef<typeof NavigationMenuPrimitive.Indicator>,
	ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Indicator>
>(function NavigationMenuIndicator({ className, ...props }, ref) {
	return (
		<NavigationMenuPrimitive.Indicator
			ref={ref}
			className={joinClasses(className)}
			{...props}
		/>
	);
});