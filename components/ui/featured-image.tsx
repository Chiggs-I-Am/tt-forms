import Image from "next/image";

export default function FeaturedImage() {
	return (
		<figure className="relative grid place-items-center w-full h-80 rounded-lg overflow-hidden [&>*]:col-span-full [&>*]:row-span-full shadow-md">
			<div className="w-full h-full dark:bg-[#111210]/60 z-10" />
			<figcaption className="z-20 px-4">
				<h1 className="max-w-[24ch] text-4xl dark:text-[#ede0de]">Filling out a form has never been easier.</h1>
				<sub className="dark:text-[#ede0de] uppercase font-medium">Online forms made easy</sub>
			</figcaption>
			<Image
				src="/images/government_plaza.jpg"
				alt="Hero image"
				className="-z-10 object-cover"
				fill
			/>
		</figure>
	);
}
