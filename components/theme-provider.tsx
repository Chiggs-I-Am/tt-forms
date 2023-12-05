"use client"

import { Theme } from "@radix-ui/themes";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes/dist/types";

export default function ThemeProvider({ children, ...props }: ThemeProviderProps ) 
{
  return (
    <>
      <NextThemesProvider attribute="class" { ...props }>
        <Theme
          accentColor="red"
          panelBackground="solid"
          scaling="100%"
          radius="full"
          asChild>
          { children }
          {/* <ThemePanel /> */}
        </Theme>
      </NextThemesProvider>
    </>
  )
}
