import AuthSessionProvider from "@/components/auth/auth-session-provider";
import ThemeProvider from "@/components/theme-provider";
import "@/styles/globals.css";
import "@radix-ui/themes/styles.css";
import "@/styles/theme-config.css";
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
    <AuthSessionProvider>
      <html lang="en" suppressHydrationWarning>
        <body>
          <AuthSessionProvider>
            <ThemeProvider>
              <div className="app">{children}</div>
            </ThemeProvider>
          </AuthSessionProvider>
        </body>
      </html>
    </AuthSessionProvider>
  );
}
