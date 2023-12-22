"use client"

import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { IconButton } from "@radix-ui/themes";
import { useTheme } from "next-themes";

export default function ThemeSwitcher() 
{
  const { theme, setTheme } = useTheme();

  return (
		<>
			<IconButton
        variant="ghost"
        color="sky"
				onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
        { theme !== "light" ? 
          ( <MoonIcon className="w-4 h-4" /> )
          : 
          ( <SunIcon className="w-4 h-4" /> )
        }
      </IconButton>
		</>
	);
}
