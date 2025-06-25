import { Button } from "@/components/ui/button";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BotIcon } from "lucide-react";

const meta = {
	title: "Components/Button",
	component: Button,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	argTypes: {
		variant: {
			control: "select",
			options: ["elevated", "filled", "tonal", "outlined", "text"],
		},
		size: {
			control: "select",
			options: ["xs", "sm", "md", "lg", "xl", "icon", "fab"],
		},
	},
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		variant: "elevated",
		size: "sm",
	},
	render: (args) =>
		args.size === "icon" ? (
			<Button {...args}>
				<BotIcon className="size-6" />
			</Button>
		) : (
			<Button {...args}>Button</Button>
		),
};

export const Elevated: Story = {
	args: {
		variant: "elevated",
		children: "Button",
	},
};

export const Filled: Story = {
	args: {
		variant: "filled",
		children: "Button",
	},
};

export const Tonal: Story = {
	args: {
		variant: "tonal",
		children: "Button",
	},
};

export const Outline: Story = {
	args: {
		variant: "outlined",
		children: "Button",
	},
};

export const Text: Story = {
	args: {
		variant: "text",
		children: "Button",
	},
};

export const xSmall: Story = {
	args: {
		size: "xs",
		children: "Button",
	},
};

export const Small: Story = {
	args: {
		size: "sm",
		children: "Button",
	},
};

export const Medium: Story = {
	args: {
		size: "md",
		children: "Button",
	},
};

export const Large: Story = {
	args: {
		size: "lg",
		children: "Button",
	},
};

export const xLarge: Story = {
	args: {
		size: "xl",
		children: "Button",
	},
};

export const Icon: Story = {
	args: {
		size: "icon",
		variant: "filled",
		children: (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="currentColor"
				className="w-5 h-5"
			>
				<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
			</svg>
		),
	},
};

export const ButtonWithIcon: Story = {
	args: {
		size: "sm",
		variant: "tonal",
		children: (
			<>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="currentColor"
					className="w-5 h-5"
				>
					<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
				</svg>
				<span>Button</span>
			</>
		),
	},
};

export const Fab: Story = {
	args: {
		size: "fab",
		variant: "filled",
		children: (
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="currentColor"
				className="w-5 h-5"
			>
				<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
			</svg>
		),
	},
};
