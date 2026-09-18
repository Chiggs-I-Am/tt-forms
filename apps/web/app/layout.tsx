import { Geist_Mono, Figtree, Nunito_Sans } from "next/font/google"

import "@workspace/ui/globals.css"
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeScript } from "@/components/theme-script"
import { ConvexClientProvider } from "@/components/convex-provider"
import { cn } from "@workspace/ui/lib/utils"

const nunitoSansHeading = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
})

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        figtree.variable,
        nunitoSansHeading.variable
      )}
    >
      <body>
        <ThemeScript />
        {/* Server auth state flows to client components through cookies.
            Queries may run in Server Components; mutations only from Server
            Actions or POST/PUT handlers (cookie-auth rule, #34). */}
        <ConvexAuthNextjsServerProvider>
          <ConvexClientProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </ConvexClientProvider>
        </ConvexAuthNextjsServerProvider>
      </body>
    </html>
  )
}
