import { MaxWidthWrapper } from "@/components/max-width-wrapper";

export function Footer() {
	return (
		<footer className="[grid-area:footer] border-t">
			<MaxWidthWrapper>
				<div className="p-4 text-center text-sm text-muted-foreground">
					<p>
						&copy; {new Date().getFullYear()} TT Forms. All rights reserved.
					</p>
				</div>
			</MaxWidthWrapper>
		</footer>
	);
}
