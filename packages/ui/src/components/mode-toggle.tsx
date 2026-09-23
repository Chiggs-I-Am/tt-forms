"use client"

import { Moon, Sun } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { useUiTheme } from "@workspace/ui/components/theme-context"

// Light/dark toggle. Reads the UiThemeProvider owned by the app; defaults to
// the light icon until the resolved theme is known.
export function ModeToggle() {
  const { resolvedTheme, setTheme } = useUiTheme()
  const dark = resolvedTheme === "dark"

  return (
    <Button
      variant="outline"
      size="icon-sm"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(dark ? "light" : "dark")}
    >
      {dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </Button>
  )
}
