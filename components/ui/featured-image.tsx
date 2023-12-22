import { joinClasses } from "@/utils/joinClasses";
import { Inter_Tight } from "next/font/google";
import Image from "next/image";

const interTight = Inter_Tight({ subsets: ["latin"] });

export default function FeaturedImage() {
	return (
		<>
			<figure className="relative grid place-items-center w-full h-80 rounded-lg overflow-hidden aspect-video *:col-span-full *:row-span-full shadow-md">
				<div className="w-full h-full dark:opacity-60 bg-[var(--gray-1)] opacity-30 z-10 transition-colors" />
				<figcaption className="z-20 px-4 dark:text-[#ede0de] text-gray-12">
					<h1 className={joinClasses( interTight.className,"max-w-[24ch] text-5xl")}>Sign-up, Simplified.</h1>
					<sub className="uppercase font-medium">Online forms made easy</sub>
				</figcaption>
				<Image
					src="/images/government_plaza.jpg"
					alt="Hero image"
					className="-z-10 object-cover"
					fill
				/>
			</figure>
		</>
	);
}
