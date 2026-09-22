import { Geist_Mono, Figtree, Nunito_Sans } from "next/font/google"

import "@workspace/ui/globals.css"
import {
  ConvexAuthNextjsServerProvider,
  convexAuthNextjsToken,
} from "@convex-dev/auth/nextjs/server"
import { SiteNavbar } from "@workspace/ui/components/site-navbar"
import { api } from "@workspace/database/api"
import { fetchQuery } from "convex/nextjs"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeScript } from "@/components/theme-script"
import { ConvexClientProvider } from "@/components/convex-provider"
import { AuthStatus } from "@/components/auth-status"
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

// Global navbar for every public page: brand, demo badge, forms link, auth
// slot, and theme toggle. The viewer lookup never crashes the layout; an
// unreachable backend renders the signed-out navbar.
async function loadViewer() {
  try {
    return await fetchQuery(
      api.users.viewer,
      {},
      { token: await convexAuthNextjsToken() }
    )
  } catch {
    return null
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const viewer = await loadViewer()

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
            <ThemeProvider>
              <SiteNavbar
                auth={<AuthStatus initialEmail={viewer?.email ?? null} />}
                width="wide"
              />
              {children}
            </ThemeProvider>
          </ConvexClientProvider>
        </ConvexAuthNextjsServerProvider>
      </body>
    </html>
  )
}
