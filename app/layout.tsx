
import ThemeProvider from "@/components/theme-provider";
import AppToolbar from "@/components/ui/app-toolbar";
import "@/styles/globals.css";
import "@radix-ui/themes/styles.css";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
	title: "Home",
	description: "Welcome to TT-Forms",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body>
				<ThemeProvider>
					<div className="app">
						<section className="[grid-area:primary-nav/fullbleed] [&>*]:grid [&>*]:[grid:subgrid/subgrid]">
							<AppToolbar />
						</section>
						{ children }
					</div>
				</ThemeProvider>
			</body>
		</html>
	);
}
