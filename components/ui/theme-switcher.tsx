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
        variant="outline"
        className="cursor-pointer"
				onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
        { theme !== "light" ? 
          ( <SunIcon className="w-4 h-4" /> )
          : 
          ( <MoonIcon className="w-4 h-4" /> )
        }
      </IconButton>
		</>
	);
}
