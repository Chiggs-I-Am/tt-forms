import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import Home from "@/app/page";
import { ThemeProvider } from "@/components/theme-provider";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { ClerkProvider } from "@clerk/nextjs";

const meta = {
	title: "pages/Home",
	component: Home,
	parameters: {
		layout: "fullscreen",
	},
	tags: ["autodocs"],
	decorators: [
		(Story) => (
			<ClerkProvider>
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
					<div className="bg-background grid min-h-screen grid-rows-[auto_1fr_auto] [grid-template-areas:_'header'_'main'_'footer'] lg:grid-cols-[1fr_400px] lg:[grid-template-areas:_'header_header'_'main_chat'_'footer_footer']">
						<Navbar />
						<Story />
						<div  className="fixed bottom-4 right-4 z-50 md:hidden">
							<Button size="fab" variant="filled">
								<MessageSquare />
								<span className="sr-only">Open Chat</span>
							</Button>
						</div>
					</div>
				</ThemeProvider>
			</ClerkProvider>
		),
	],
} satisfies Meta<typeof Home>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
