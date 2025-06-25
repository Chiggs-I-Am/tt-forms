import { Footer } from "@/components/footer";
import { MaxWidthWrapper } from "@/components/max-width-wrapper";

export default function Home() {
	return (
		<>
			<main className="[grid-area:main]">
				<MaxWidthWrapper>
					<div className="p-4">
						<h1 className="text-2xl font-bold">Welcome to TT Forms</h1>
						<p className="text-muted-foreground">
							This is the main content area.
						</p>
					</div>
				</MaxWidthWrapper>
			</main>
			<aside className="[grid-area:chat] hidden border-l p-4 lg:block">
				<h2 className="text-lg font-semibold">Chat</h2>
				<p className="text-sm text-muted-foreground">Chatbot placeholder</p>
			</aside>
			<Footer />
		</>
	);
}
