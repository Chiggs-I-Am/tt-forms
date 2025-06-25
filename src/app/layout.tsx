import { Navbar } from "@/components/navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { ClerkProvider } from "@clerk/nextjs";
import { MessageSquare } from "lucide-react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	subsets: ["latin"],
	variable: "--font-geist-mono",
});

export const metadata: Metadata = {
	title: "TT Forms",
	description: "A new way to handle forms and appointments.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<ClerkProvider>
			<html
				lang="en"
				className={`${geistSans.variable} ${geistMono.variable} dark`}
				suppressHydrationWarning
			>
				<body>
					<ThemeProvider
						attribute="class"
						defaultTheme="system"
						enableSystem
						disableTransitionOnChange
					>
						<Navbar />
						<div className="@container grid min-h-screen grid-rows-[auto_1fr_auto] [grid-template-areas:_'header'_'main'_'footer'] lg:grid-cols-[1fr_400px] lg:[grid-template-areas:_'header_header'_'main_chat'_'footer_footer']">
							{children}
						</div>
						<Button size="fab" variant="filled" className="fixed bottom-4 right-4 z-50 md:hidden">
							<MessageSquare />
							<span className="sr-only">Open Chat</span>
						</Button>
					</ThemeProvider>
				</body>
			</html>
		</ClerkProvider>
	);
}
