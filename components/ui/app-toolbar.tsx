"use client";

import { NavLinks } from "@/data/links";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "./navigation-menu";
import { Button, Card } from "@radix-ui/themes";
import ThemeSwitcher from "./theme-switcher";

export default function AppToolbar() {
  return (
    <div className="flex items-center justify-between [grid-area:main]">
      <Link href="/" className="text-sm font-medium text-gray-11">
        TT-Forms
      </Link>
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger className="font-medium text-gray-11">
              Registries
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid list-none gap-x-[10px] rounded-lg bg-gray-2 py-6 sm:w-56">
                {NavLinks.map((link, index) => (
                  <li key={link.title}>
                    <NavigationMenuLink asChild>
                      <Link
                        className="flex h-10 items-center px-6 hover:bg-accent-3"
                        href={link.href}
                      >
                        {link.title}
                      </Link>
                    </NavigationMenuLink>
                  </li>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuIndicator />
        </NavigationMenuList>
      </NavigationMenu>
      <div className="flex items-center gap-2">
        <Button variant="ghost" color="gray" asChild>
          <Link href="/sign-in" className="text-sm font-medium">
            Sign in
          </Link>
        </Button>
        <div className="grid h-7 w-7 place-items-center">
          <ThemeSwitcher />
        </div>
      </div>
    </div>
  );
}
