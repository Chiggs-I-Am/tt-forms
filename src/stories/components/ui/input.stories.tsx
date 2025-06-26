import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Input } from "@/components/ui/input";

const meta = {
	title: "Components/Input",
	component: Input,
	parameters: {
		layout: "fullscreen",
		docs: {
			story: {
				inline: true,
			},
		},
	},
	decorators: [
		(Story, context) => {
			// Only apply fullscreen background in Canvas view, not in Docs
			if (context.viewMode === 'story') {
				return (
					<div className="grid place-items-center min-h-[100dvh] w-full bg-background text-on-surface p-8 transition-colors duration-300">
						<Story />
					</div>
				);
			}
			// For Docs view, use minimal decoration
			return (
				<div className="grid place-items-center bg-background text-on-surface p-4 transition-colors duration-300 rounded-lg">
					<Story />
				</div>
			);
		},
	],
	tags: ["autodocs"],
	argTypes: {
		variant: {
			control: { type: "radio" },
			options: ["filled", "outlined"],
		},
		label: { control: "text" },
		disabled: { control: "boolean" },
		type: {
			control: { type: "select" },
			options: ["text", "email", "password", "number", "tel", "url"],
		},
	},
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Filled: Story = {
	args: {
		variant: "filled",
		label: "Filled text field",
	},
};

export const Outlined: Story = {
	args: {
		variant: "outlined",
		label: "Email Address",
	},
};

export const FilledDisabled: Story = {
	args: {
		variant: "filled",
		label: "Disabled field",
		disabled: true,
	},
};

export const OutlinedDisabled: Story = {
	args: {
		variant: "outlined",
		label: "Disabled field",
		disabled: true,
	},
};

export const Form: Story = {
	args: {
		label: "Form example",
	},
	render: () => (
		<div className="grid w-full max-w-sm items-center gap-8">
			<div>
				<h3 className="pb-4 text-lg font-medium">Filled</h3>
				<div className="grid items-center gap-4">
					<Input variant="filled" label="Email" type="email" />
					<Input variant="filled" label="Password" type="password" />
					<Input variant="filled" label="Disabled" disabled />
				</div>
			</div>
			<div>
				<h3 className="pb-4 text-lg font-medium">Outlined</h3>
				<div className="grid items-center gap-4">
					<Input variant="outlined" label="Email" type="email" />
					<Input variant="outlined" label="Password" type="password" />
					<Input variant="outlined" label="Disabled" disabled />
				</div>
			</div>
		</div>
	),
};

export const AllVariants: Story = {
	args: {
		label: "All variants example",
	},
	render: () => (
		<div className="grid w-full max-w-lg gap-12">
			<div>
				<h2 className="mb-6 text-xl font-semibold text-on-surface">Input Field Variants</h2>
				<div className="grid gap-8">
					<div>
						<h3 className="mb-4 text-lg font-medium text-on-surface-variant">Filled Variant</h3>
						<div className="grid gap-4">
							<Input variant="filled" label="Text input" type="text" />
							<Input variant="filled" label="Email input" type="email" />
							<Input variant="filled" label="Password input" type="password" />
							<Input variant="filled" label="Number input" type="number" />
							<Input variant="filled" label="Disabled input" disabled />
						</div>
					</div>
					<div>
						<h3 className="mb-4 text-lg font-medium text-on-surface-variant">Outlined Variant</h3>
						<div className="grid gap-4">
							<Input variant="outlined" label="Text input" type="text" />
							<Input variant="outlined" label="Email input" type="email" />
							<Input variant="outlined" label="Password input" type="password" />
							<Input variant="outlined" label="Number input" type="number" />
							<Input variant="outlined" label="Disabled input" disabled />
						</div>
					</div>
				</div>
			</div>
		</div>
	),
};
