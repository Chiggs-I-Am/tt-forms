import type { ReactNode } from "react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { ModeToggle } from "@workspace/ui/components/mode-toggle"
import { cn } from "cn"

// Site navbar for TT Forms. Server-safe: interactive auth state arrives
// through the `auth` slot owned by the app.
export function SiteNavbar({
  auth,
  width = "narrow",
}: {
  auth?: ReactNode
  width?: "narrow" | "wide"
}) {
  return (
    <header className="border-b border-border bg-background">
      <div
        className={cn(
          "mx-auto flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-3 px-6 py-4",
          width === "narrow" ? "max-w-xl" : "max-w-5xl"
        )}
      >
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="font-heading text-base font-semibold tracking-wide outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          >
            TT-FORMS
          </a>
          <Badge variant="outline">Demo</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<a href="/forms" />}
          >
            Browse forms
          </Button>
          {auth}
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
