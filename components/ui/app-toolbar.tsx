"use client"

import Link from "next/link";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "./navigation-menu";
import { NavigationMenuViewport } from "@radix-ui/react-navigation-menu";

export default function AppToolbar() {
	return (
		<NavigationMenu className="[grid-area:main] relative">
			<NavigationMenuList className="flex items-center list-none">
				<NavigationMenuItem className="text-2xl font-medium" asChild>
					<Link href="/">TT-Forms</Link>
				</NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger className="relative flex px-4 select-none items-center justify-between text-sm font-medium">
            Registries
            {/* <CaretDownIcon /> */}
          </NavigationMenuTrigger>
          <NavigationMenuContent className="absolute top-0 left-0 w-full sm:w-auto">
            <ul className="grid list-none gap-x-[10px] p-[22px] sm:w-[500px] outline outline-1 outline-gray-50 rounded-lg">
              <li>
                <NavigationMenuLink asChild>
                  <Link href="/registry/company">Company</Link>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link href="#">Civil</Link>
                </NavigationMenuLink>
              </li>
              <li>
                <NavigationMenuLink asChild>
                  <Link href="#">Land</Link>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

				<NavigationMenuItem>
					<NavigationMenuLink asChild>
						<Link href="/registry">Registries</Link>
					</NavigationMenuLink>
				</NavigationMenuItem>
			</NavigationMenuList>

      <div className="perspective-[2000px] absolute top-full left-0 flex w-full justify-center origin-[top_center]">
        <NavigationMenuViewport />
      </div>
		</NavigationMenu>
	);
}
