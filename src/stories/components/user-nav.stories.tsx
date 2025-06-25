import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ThemeProvider } from "@/components/theme-provider";
import { UserNav } from "@/components/user-nav";
import { ClerkProvider } from "@clerk/nextjs";

const meta = {
	title: "components/UserNav",
	component: UserNav,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	decorators: [
		(Story) => (
			<ClerkProvider>
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
					<Story />
				</ThemeProvider>
			</ClerkProvider>
		),
	],
} satisfies Meta<typeof UserNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
