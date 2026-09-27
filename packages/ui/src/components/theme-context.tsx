"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type UiTheme = "light" | "dark" | "system";
export type ResolvedUiTheme = "light" | "dark";

interface UiThemeContextValue {
  theme: UiTheme;
  resolvedTheme: ResolvedUiTheme;
  setTheme: (theme: UiTheme) => void;
}

const UiThemeContext = createContext<UiThemeContextValue>({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => {},
});

// Class-based theme provider. Applies `dark` to <html>, persists the choice
// in localStorage, and follows the OS setting on "system". Renders no
// <script> element, which Next 16 rejects inside React components.
export const UiThemeProvider = ({
  children,
  defaultTheme = "system",
  storageKey = "tt-forms-theme",
}: {
  readonly children: ReactNode;
  readonly defaultTheme?: UiTheme;
  readonly storageKey?: string;
}) => {
  const [theme, setTheme] = useState<UiTheme>(defaultTheme);
  const [systemDark, setSystemDark] = useState(false);

  useEffect(() => {
    // Mount-only sync with browser state (stored theme, media query).
    // Reading these during render would break SSR and hydration, so the
    // single extra render from this effect is intentional.
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored === "light" || stored === "dark" || stored === "system") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTheme(stored);
      }
    } catch {
      // Private-mode storage; fall through to the default.
    }

    const query = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(query.matches);
    const onChange = (event: MediaQueryListEvent) => {
      setSystemDark(event.matches);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [storageKey]);

  const resolvedTheme: ResolvedUiTheme =
    theme === "system" ? (systemDark ? "dark" : "light") : theme;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
    try {
      window.localStorage.setItem(storageKey, theme);
    } catch {
      // Ignore write failures; the class toggle above already applied.
    }
  }, [resolvedTheme, theme, storageKey]);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme]
  );

  return (
    <UiThemeContext.Provider value={value}>{children}</UiThemeContext.Provider>
  );
};

export function useUiTheme() {
  return useContext(UiThemeContext);
}
