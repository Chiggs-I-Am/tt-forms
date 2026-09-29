"use client";

import * as React from "react";
import {
  UiThemeProvider,
  useUiTheme,
} from "@workspace/ui/components/theme-context";

export const ThemeProvider = ({
  children,
  defaultTheme = "system",
  storageKey = "theme",
  enableSystem = true,
  disableTransitionOnChange = false,
}: {
  readonly children: React.ReactNode;
  readonly defaultTheme?: "light" | "dark" | "system";
  readonly storageKey?: string;
  readonly enableSystem?: boolean;
  readonly disableTransitionOnChange?: boolean;
}) => {
  return (
    <UiThemeProvider
      defaultTheme={defaultTheme}
      storageKey={storageKey}
      enableSystem={enableSystem}
      disableTransitionOnChange={disableTransitionOnChange}
    >
      <ThemeHotkey />
      {children}
    </UiThemeProvider>
  );
};

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

const ThemeHotkey = () => {
  const { resolvedTheme, setTheme } = useUiTheme();

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (typeof event.key !== "string" || event.key.toLowerCase() !== "d") {
        return;
      }

      if (isTypingTarget(event.target)) {
        return;
      }

      setTheme(resolvedTheme === "dark" ? "light" : "dark");
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [resolvedTheme, setTheme]);

  return null;
};
