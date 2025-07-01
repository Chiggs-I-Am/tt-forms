import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import * as React from "react";
import { useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";

const meta: Meta<typeof Checkbox> = {
	title: "Components/Checkbox",
	component: Checkbox,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"A checkbox component built with Radix UI primitives and styled with Material Design 3 tokens. Follows shadcn/ui patterns for composability and accessibility.",
			},
		},
	},
	tags: ["autodocs"],
	argTypes: {
		disabled: {
			control: "boolean",
			description: "Disables the checkbox",
		},
		checked: {
			control: "boolean",
			description: "The controlled checked state of the checkbox",
		},
		defaultChecked: {
			control: "boolean",
			description: "The default checked state when uncontrolled",
		},
		onCheckedChange: {
			action: "checkedChange",
			description: "Event handler called when the checked state changes",
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {},
	argTypes: {
		// For the default story, disable checked control to avoid conflicts with defaultChecked
		checked: { control: false },
	},
	render: (args: React.ComponentProps<typeof Checkbox>) => <Checkbox {...args} />,
};

export const Checked: Story = {
	args: {
		defaultChecked: true,
	},
	argTypes: {
		// Disable checked control for this story since we're using defaultChecked
		checked: { control: false },
	},
	render: (args: React.ComponentProps<typeof Checkbox>) => <Checkbox {...args} />,
};

export const Disabled: Story = {
	args: {
		disabled: true,
	},
	argTypes: {
		// Disable checked control for disabled story
		checked: { control: false },
	},
	render: (args: React.ComponentProps<typeof Checkbox>) => <Checkbox {...args} />,
};

export const Playground: Story = {
	args: {
		checked: false,
		disabled: false,
	},
	argTypes: {
		// For playground, only allow controlled props
		defaultChecked: { control: false },
	},
	render: (args: React.ComponentProps<typeof Checkbox>) => {
		// Use a controlled approach for the playground
		const [checked, setChecked] = useState(args.checked || false);
		
		// Update local state when args change
		React.useEffect(() => {
			setChecked(args.checked || false);
		}, [args.checked]);
		
		return (
			<div className="space-y-2">
				<Checkbox
					{...args}
					checked={checked}
					onCheckedChange={(checkedState) => {
						if (typeof checkedState === "boolean") {
							setChecked(checkedState);
							args.onCheckedChange?.(checkedState);
						}
					}}
				/>
				<p className="text-sm text-on-surface-variant">
					Use the controls to test different states
				</p>
			</div>
		);
	},
	parameters: {
		docs: {
			description: {
				story: "Interactive playground for testing checkbox with Storybook controls. This uses controlled state management.",
			},
		},
	},
};

export const DisabledChecked: Story = {
	args: {
		disabled: true,
		defaultChecked: true,
	},
	argTypes: {
		// Disable checked control for this story since we're using defaultChecked
		checked: { control: false },
	},
	render: (args: React.ComponentProps<typeof Checkbox>) => <Checkbox {...args} />,
};

export const Controlled: Story = {
	argTypes: {
		// Disable controls for this story since it manages its own state
		checked: { control: false },
		defaultChecked: { control: false },
		onCheckedChange: { control: false },
	},
	render: () => {
		const [checked, setChecked] = useState(false);
		
		return (
			<div className="space-y-2">
				<Checkbox
					checked={checked}
					onCheckedChange={(checkedState) => {
						// Handle CheckedState which can be boolean or "indeterminate"
						if (typeof checkedState === "boolean") {
							setChecked(checkedState);
						}
					}}
				/>
				<p className="text-sm text-on-surface-variant">
					Checkbox is {checked ? "checked" : "unchecked"}
				</p>
			</div>
		);
	},
	parameters: {
		docs: {
			description: {
				story: "A controlled checkbox example with state management.",
			},
		},
	},
};

export const Uncontrolled: Story = {
	argTypes: {
		// For uncontrolled, only allow defaultChecked and disabled
		checked: { control: false },
		onCheckedChange: { control: false },
	},
	args: {
		defaultChecked: false,
	},
	render: (args: React.ComponentProps<typeof Checkbox>) => (
		<div className="space-y-2">
			<Checkbox {...args} />
			<p className="text-sm text-on-surface-variant">
				This checkbox manages its own state internally (uncontrolled)
			</p>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "An uncontrolled checkbox that manages its own state. Use defaultChecked to set the initial state.",
			},
		},
	},
};

export const WithLabel: Story = {
	render: () => (
		<div className="flex items-center space-x-2">
			<Checkbox id="terms" />
			<label
				htmlFor="terms"
				className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-38"
			>
				Accept terms and conditions
			</label>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "Checkbox with an associated label. Uses the `peer` utility class for styling based on checkbox state.",
			},
		},
	},
};

export const WithDescription: Story = {
	render: () => (
		<div className="flex items-start space-x-2">
			<Checkbox id="marketing" className="mt-0.5" />
			<div className="space-y-1">
				<label
					htmlFor="marketing"
					className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-38"
				>
					Marketing emails
				</label>
				<p className="text-sm text-on-surface-variant">
					Receive emails about new products, features, and more.
				</p>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "Checkbox with a label and description for more context.",
			},
		},
	},
};

export const FormGroup: Story = {
	render: () => {
		const [checkedItems, setCheckedItems] = useState({
			notifications: false,
			marketing: false,
			security: true,
		});

		function handleCheckedChange(key: keyof typeof checkedItems) {
			return (checked: boolean | "indeterminate") => {
				if (typeof checked === "boolean") {
					setCheckedItems(prev => ({
						...prev,
						[key]: checked,
					}));
				}
			};
		}

		return (
			<div className="space-y-4">
				<div className="space-y-2">
					<h3 className="text-sm font-medium">Email Preferences</h3>
					<p className="text-sm text-on-surface-variant">
						Choose which emails you&apos;d like to receive.
					</p>
				</div>
				<div className="space-y-3">
					<div className="flex items-center space-x-2">
						<Checkbox
							id="notifications"
							checked={checkedItems.notifications}
							onCheckedChange={handleCheckedChange("notifications")}
						/>
						<label
							htmlFor="notifications"
							className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-38"
						>
							Push notifications
						</label>
					</div>
					<div className="flex items-center space-x-2">
						<Checkbox
							id="marketing"
							checked={checkedItems.marketing}
							onCheckedChange={handleCheckedChange("marketing")}
						/>
						<label
							htmlFor="marketing"
							className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-38"
						>
							Marketing emails
						</label>
					</div>
					<div className="flex items-center space-x-2">
						<Checkbox
							id="security"
							checked={checkedItems.security}
							onCheckedChange={handleCheckedChange("security")}
						/>
						<label
							htmlFor="security"
							className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-38"
						>
							Security alerts
						</label>
					</div>
				</div>
			</div>
		);
	},
	parameters: {
		docs: {
			description: {
				story: "A group of checkboxes with independent state management, commonly used in forms and settings.",
			},
		},
	},
};

export const AllStates: Story = {
	argTypes: {
		// Disable all controls for this story since it's a showcase
		checked: { control: false },
		defaultChecked: { control: false },
		disabled: { control: false },
		onCheckedChange: { control: false },
	},
	render: () => (
		<div className="grid grid-cols-2 gap-4">
			<div className="space-y-2">
				<h4 className="text-sm font-medium">Default States</h4>
				<div className="space-y-2">
					<div className="flex items-center space-x-2">
						<Checkbox />
						<span className="text-sm">Unchecked</span>
					</div>
					<div className="flex items-center space-x-2">
						<Checkbox defaultChecked />
						<span className="text-sm">Checked</span>
					</div>
				</div>
			</div>
			<div className="space-y-2">
				<h4 className="text-sm font-medium">Disabled States</h4>
				<div className="space-y-2">
					<div className="flex items-center space-x-2">
						<Checkbox disabled />
						<span className="text-sm text-on-surface-variant">Disabled unchecked</span>
					</div>
					<div className="flex items-center space-x-2">
						<Checkbox disabled defaultChecked />
						<span className="text-sm text-on-surface-variant">Disabled checked</span>
					</div>
				</div>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "Overview of all checkbox states including enabled, disabled, checked, and unchecked variations.",
			},
		},
	},
};