"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type UiTheme = "light" | "dark" | "system";
export type ResolvedUiTheme = "light" | "dark";

interface UiThemeContextValue {
  theme: UiTheme;
  resolvedTheme: ResolvedUiTheme;
  setTheme: (theme: UiTheme) => void;
  themes: string[];
  systemTheme?: ResolvedUiTheme;
}

const UiThemeContext = createContext<UiThemeContextValue>({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => {},
  themes: ["light", "dark", "system"],
});

export const UiThemeProvider = ({
  children,
  defaultTheme = "system",
  storageKey = "theme",
  enableSystem = true,
  disableTransitionOnChange = false,
}: {
  readonly children: ReactNode;
  readonly defaultTheme?: UiTheme;
  readonly storageKey?: string;
  readonly enableSystem?: boolean;
  readonly disableTransitionOnChange?: boolean;
}) => {
  const [theme, setTheme] = useState<UiTheme>(defaultTheme);
  const [systemTheme, setSystemTheme] = useState<ResolvedUiTheme>("light");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored === "light" || stored === "dark" || stored === "system") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTheme(stored);
      }
    } catch {
      // localStorage unavailable (private mode)
    }

    const query = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemTheme(query.matches ? "dark" : "light");
    const onChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [storageKey]);

  const resolvedTheme: ResolvedUiTheme =
    theme === "system" ? systemTheme : theme;

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");

    if (disableTransitionOnChange) {
      const style = document.createElement("style");
      style.appendChild(
        document.createTextNode(
          "*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}"
        )
      );
      document.head.appendChild(style);
      const cleanup = () => {
        window.getComputedStyle(document.body);
        setTimeout(() => {
          document.head.removeChild(style);
        }, 1);
      };
      return cleanup;
    }

    try {
      window.localStorage.setItem(storageKey, theme);
    } catch {
      // localStorage unavailable (private mode)
    }

    return undefined;
  }, [resolvedTheme, theme, storageKey, disableTransitionOnChange]);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      themes: enableSystem ? ["light", "dark", "system"] : ["light", "dark"],
      systemTheme: enableSystem ? systemTheme : undefined,
    }),
    [theme, resolvedTheme, setTheme, enableSystem, systemTheme]
  );

  return (
    <UiThemeContext.Provider value={value}>{children}</UiThemeContext.Provider>
  );
};

export function useUiTheme() {
  return useContext(UiThemeContext);
}
