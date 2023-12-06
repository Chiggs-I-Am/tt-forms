import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";

interface FeaturedItemProps
{
  href: string;
  children: ReactNode;
  title: string;
  imageSrc: string;
}

export default function FeaturedItem({ href, children, title, imageSrc }: FeaturedItemProps) {
	return (
		<Link href={href}>
			<div className="relative grid w-full place-items-center text-xs uppercase aspect-video rounded-lg overflow-hidden border border-solid dark:border-[#a08c8b] hover:dark:border-[#ffb3ae] [&>*]:col-span-full [&>*]:row-span-full group">
				<div className="grid place-items-center">
					{ children }
					<h3 className="text-xs dark:text-[#ede0de] font-medium">{title}</h3>
				</div>
				<div className="w-full h-full dark:bg-[#201a1a]/60 -z-10 group-hover:dark:bg-[#201a1a]/40 transition-all" />
				<Image
					src={imageSrc}
					alt="company registry"
					className="-z-20 group-hover:scale-125 transition-all"
					fill
          priority
				/>
			</div>
		</Link>
	);
}
