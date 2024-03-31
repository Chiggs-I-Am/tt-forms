"use client";

import { navLinks } from "@/data/navLinks";
import { Avatar, Button, Heading, Popover, Text } from "@radix-ui/themes";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./navigation-menu";
import ThemeSwitcher from "./theme-switcher";

export default function AppToolbar() {
  const { data: session } = useSession();
  const user = session?.user;

  function getInitials(name: string) {
    const matches = name.match(/(\b\S)?/g);
    const initials = matches?.join("");
    return initials?.match(/(^\S|\S$)?/g)?.join("") as string;
  }

  return (
    <div className="flex items-center justify-between [grid-area:main]">
      <Link href="/" className="text-sm font-medium text-gray-11">
        TT-Forms
      </Link>
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger className="select-none font-medium text-gray-11">
              Registries
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid list-none gap-x-[10px] rounded-lg bg-gray-2 py-6 *:text-sm sm:w-56">
                {navLinks.map((link, index) => (
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
        {!session ? (
          <Button
            variant="ghost"
            color="gray"
            onClick={() => {
              signIn();
            }}
          >
            Sign in
          </Button>
        ) : (
          <Popover.Root>
            <Popover.Trigger>
              <Avatar
                src={session.user.image as string}
                size="2"
                fallback={getInitials(session.user.name as string)}
              />
            </Popover.Trigger>
            <Popover.Content size="4">
              <div className="grid place-items-center gap-2">
                <Avatar
                  variant="soft"
                  src={session.user.image as string}
                  size="6"
                  fallback={getInitials(session.user.name as string)}
                />
                <div className="gap-1">
                  <Heading as="h2" size="5" weight="regular" align="center">
                    Hi {user?.name?.split(" ")[0]}!
                  </Heading>
                  <Text as="p" size="1" align="center" color="gray">
                    {user?.email}
                  </Text>
                </div>
              </div>
              <div className="relative grid gap-2">
                <div className="grid h-10 place-items-center">
                  <Link
                    href="#"
                    className="select-none text-sm font-medium text-blue-500"
                  >
                    Manage your account
                  </Link>
                </div>
                <Button
                  variant="soft"
                  color="gray"
                  onClick={() => {
                    signOut();
                  }}
                >
                  Sign out
                </Button>
              </div>
            </Popover.Content>
          </Popover.Root>
        )}
        <div className="grid h-7 w-7 place-items-center">
          <ThemeSwitcher />
        </div>
      </div>
    </div>
  );
}
