import { Logo } from "@/components/logo";
import { MaxWidthWrapper } from "@/components/max-width-wrapper";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserNav } from "@/components/user-nav";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
	{ href: "/forms", label: "Forms" },
	{ href: "/appointments", label: "Appointments" },
	{ href: "/settings", label: "Settings" },
];

export function Navbar({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
	const pathname = usePathname();
	return (
		<nav className={cn(
			"[grid-area:header] sticky top-0 z-50 w-full border-b border-outline-variant/40 bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/60",
			className
		)} {...props}>
			<MaxWidthWrapper>
				<div className="flex h-14 w-full items-center">
					<div className="hidden md:flex">
						<Link href="/" className="mr-6 flex items-center space-x-2">
							<Logo />
						</Link>
						<div className="flex items-center space-x-4 lg:space-x-6">
							{navLinks.map(({ href, label }) => (
								<Link
									key={href}
									href={href}
									className={cn(
										"text-sm font-medium transition-colors px-2 py-1 rounded-md",
										pathname?.startsWith(href)
											? "text-on-surface bg-surface-container-high"
											: "text-on-surface-variant hover:text-on-primary hover:bg-primary/90",
									)}
								>
									{label}
								</Link>
							))}
						</div>
					</div>
					<div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
						<div className="w-full flex-1 md:w-auto md:flex-none">
							{/* Search bar can go here */}
						</div>
						<div className="flex items-center gap-2">
							<ThemeToggle />
							<UserNav />
						</div>
					</div>
				</div>
			</MaxWidthWrapper>
		</nav>
	);
}
