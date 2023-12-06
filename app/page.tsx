import FeaturedImage from "@/components/ui/featured-image";
import FeaturedItem from "@/components/ui/featured-item";
import { joinClasses } from "@/utils/joinClasses";
import { Card } from "@radix-ui/themes";

import { Anton } from "next/font/google";

const anton = Anton({ weight: "400", display: "swap", subsets: ["latin"] });

export default function Page() {
	return (
		<main className="[grid-area:main/fullbleed]">
			<div className="@container [grid-area:main] grid gap-4 w-[min(100%,1176px)] h-fit grid-cols-[repeat(auto-fit,minmax(282px,1fr))] grid-row-[repeat(auto-fit,min(100%,320px))] justify-self-center">
				<section className="@xl:col-span-2">
					<FeaturedImage />
				</section>

				<section className="@3xl:col-start-1">
					<div className="grid gap-2 grid-cols-[repeat(2,minmax(140px,1fr))] max-w-[580px] grid-rows-2">
						<FeaturedItem
							href="/registry/company"
							title="Company registry"
							imageSrc="/images/company_registry.png"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								height="24"
								viewBox="0 -960 960 960"
								width="24"
								className="dark:fill-[#ede0de]"
							>
								<path d="M160-720v-80h640v80H160Zm0 560v-240h-40v-80l40-200h640l40 200v80h-40v240h-80v-240H560v240H160Zm80-80h240v-160H240v160Zm-38-240h556-556Zm0 0h556l-24-120H226l-24 120Z" />
							</svg>
						</FeaturedItem>
						<FeaturedItem
							href="/registry/civil"
							title="Civil registry"
							imageSrc="/images/civil_registry.png"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								height="24"
								viewBox="0 -960 960 960"
								width="24"
                className="dark:fill-[#ede0de]"
							>
								<path d="M720-720q-33 0-56.5-23.5T640-800q0-33 23.5-56.5T720-880q33 0 56.5 23.5T800-800q0 33-23.5 56.5T720-720ZM680-80v-320q0-40-20.5-72T607-522l35-103q8-25 29.5-40t48.5-15q27 0 48.5 15t29.5 40l102 305H800v240H680ZM500-500q-25 0-42.5-17.5T440-560q0-25 17.5-42.5T500-620q25 0 42.5 17.5T560-560q0 25-17.5 42.5T500-500ZM220-720q-33 0-56.5-23.5T140-800q0-33 23.5-56.5T220-880q33 0 56.5 23.5T300-800q0 33-23.5 56.5T220-720ZM140-80v-280H80v-240q0-33 23.5-56.5T160-680h120q33 0 56.5 23.5T360-600v240h-60v280H140Zm300 0v-160h-40v-160q0-25 17.5-42.5T460-460h80q25 0 42.5 17.5T600-400v160h-40v160H440Z" />
							</svg>
						</FeaturedItem>

						<FeaturedItem
							href="/registry/land"
							title="Land registry"
							imageSrc="/images/land_registry.png"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								height="24"
								viewBox="0 -960 960 960"
								width="24"
								className="dark:fill-[#ede0de]"
							>
								<path d="m40-240 240-320 180 240h300L560-586 460-454l-50-66 150-200 360 480H40Zm521-80Zm-361 0h160l-80-107-80 107Zm0 0h160-160Z" />
							</svg>
						</FeaturedItem>

						<FeaturedItem
							href="/registry/digital"
							title="Digital registry"
							imageSrc="/images/digital.avif"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								height="24"
								viewBox="0 -960 960 960"
								width="24"
								className="dark:fill-[#ede0de]"
							>
								<path d="M80-160v-120h80v-440q0-33 23.5-56.5T240-800h600v80H240v440h240v120H80Zm520 0q-17 0-28.5-11.5T560-200v-400q0-17 11.5-28.5T600-640h240q17 0 28.5 11.5T880-600v400q0 17-11.5 28.5T840-160H600Zm40-120h160v-280H640v280Zm0 0h160-160Z" />
							</svg>
						</FeaturedItem>
					</div>
				</section>

				<Card variant="classic">
					<div className="flex w-full h-full aspect-video rounded-lg overflow-hidden text-3xl">
						<h3 className={joinClasses(anton.className)}>Need to come in?</h3>
					</div>
				</Card>

				<div className="flex flex-col gap-4 @2xl:flex-row @2xl:col-span-2 @3xl:col-span-1 @3xl:col-start-3 @3xl:row-start-1 @3xl:row-span-2">
					<Card variant="surface">
						<div className="flex w-full h-[minmax(320px,100%)] p-4 rounded-lg overflow-hidden">
							<h3 className={joinClasses(anton.className, "text-3xl")}>Need to more info?</h3>
						</div>
					</Card>
				</div>
			</div>
		</main>
	);
}
