import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SelectField, SelectItem } from "@/components/ui/select";

const meta = {
	title: "Components/Select",
	component: SelectField,
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
	},
} satisfies Meta<typeof SelectField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Filled: Story = {
	args: {
		variant: "filled",
		label: "Favorite Fruit",
	},
	render: (args) => (
		<div className="w-80">
			<SelectField {...args}>
				<SelectItem value="apple">Apple</SelectItem>
				<SelectItem value="banana">Banana</SelectItem>
				<SelectItem value="orange">Orange</SelectItem>
				<SelectItem value="grape">Grape</SelectItem>
				<SelectItem value="strawberry">Strawberry</SelectItem>
			</SelectField>
		</div>
	),
};

export const Outlined: Story = {
	args: {
		variant: "outlined",
		label: "Choose Country",
	},
	render: (args) => (
		<div className="w-80">
			<SelectField {...args}>
				<SelectItem value="us">United States</SelectItem>
				<SelectItem value="ca">Canada</SelectItem>
				<SelectItem value="uk">United Kingdom</SelectItem>
				<SelectItem value="fr">France</SelectItem>
				<SelectItem value="de">Germany</SelectItem>
			</SelectField>
		</div>
	),
};

export const Form: Story = {
	render: () => (
		<div className="grid w-full max-w-md items-center gap-8">
			<div>
				<h3 className="pb-4 text-lg font-medium">Filled</h3>
				<div className="grid items-center gap-4">
					<SelectField variant="filled" label="Favorite Fruit">
						<SelectItem value="apple">Apple</SelectItem>
						<SelectItem value="banana">Banana</SelectItem>
						<SelectItem value="orange">Orange</SelectItem>
						<SelectItem value="grape">Grape</SelectItem>
					</SelectField>
					<SelectField variant="filled" label="Country">
						<SelectItem value="us">United States</SelectItem>
						<SelectItem value="ca">Canada</SelectItem>
						<SelectItem value="uk">United Kingdom</SelectItem>
						<SelectItem value="fr">France</SelectItem>
					</SelectField>
					<SelectField variant="filled" label="Disabled" disabled>
						<SelectItem value="apple">Apple</SelectItem>
						<SelectItem value="banana">Banana</SelectItem>
					</SelectField>
				</div>
			</div>
			<div>
				<h3 className="pb-4 text-lg font-medium">Outlined</h3>
				<div className="grid items-center gap-4">
					<SelectField variant="outlined" label="Favorite Fruit">
						<SelectItem value="apple">Apple</SelectItem>
						<SelectItem value="banana">Banana</SelectItem>
						<SelectItem value="orange">Orange</SelectItem>
						<SelectItem value="grape">Grape</SelectItem>
					</SelectField>
					<SelectField variant="outlined" label="Country">
						<SelectItem value="us">United States</SelectItem>
						<SelectItem value="ca">Canada</SelectItem>
						<SelectItem value="uk">United Kingdom</SelectItem>
						<SelectItem value="fr">France</SelectItem>
					</SelectField>
					<SelectField variant="outlined" label="Disabled" disabled>
						<SelectItem value="apple">Apple</SelectItem>
						<SelectItem value="banana">Banana</SelectItem>
					</SelectField>
				</div>
			</div>
		</div>
	),
};
