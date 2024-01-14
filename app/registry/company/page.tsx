import { Button, Card, Heading, Inset, Text } from "@radix-ui/themes";
import Image from "next/image";
import Link from "next/link";

export default function Page() {
	return (
		<main className="[grid-area:main/fullbleed]">
			<section className="[grid-area:main] @container">
				<div className="max-w-screen-md mx-auto">
					<div className="grid grid-cols-[repeat(auto-fit,minmax(240px,280px))] gap-4">
						<Card>
						<Inset clip="padding-box" side="top" pb="current">
							<div className="relative w-full aspect-video">
								<Image
									src="/images/company_registry.png"
									alt="company registry"
									className="object-cover transition-all group-hover:scale-125"
									fill
									priority
								/>
							</div>
						</Inset>
						<div className="grid">
							<Heading as="h2" size="3">Name search reservation</Heading>
							<Text as="p" size="2">Lorem ipsum</Text>
							<Link href="company/form" className="justify-self-end">
								<Button size="3" variant="soft">Reserve business name</Button>
							</Link>
						</div>
						</Card>
						<Card>
						<Inset clip="padding-box" side="top" pb="current">
							<div className="relative w-full aspect-video">
								<Image
									src="/images/civil_registry.png"
									alt="company registry"
									className="object-cover transition-all group-hover:scale-125"
									fill
									priority
								/>
							</div>
						</Inset>
						<div className="grid">
							<Heading as="h2" size="3">Notice of directors</Heading>
							<Text as="p" size="2">Lorem ipsum</Text>
							<Link href="company/form/notice-of-directors" className="justify-self-end">
								<Button size="3" variant="soft">Manage directors</Button>
							</Link>
						</div>
						</Card>
					</div>
				</div>
			</section>
		</main>
	);
}
