import { joinClasses } from "@/utils/joinClasses";
import { Noto_Sans } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";

const notoSans = Noto_Sans({ subsets: ["latin"] });

interface FeaturedItemProps {
  href: string;
  children: ReactNode;
  title: string;
  imageSrc: string;
}

export default function FeaturedItem({
  href,
  children,
  title,
  imageSrc,
}: FeaturedItemProps) {
  return (
    <Link href={href}>
      <div className="group relative grid aspect-video h-full w-full place-items-center overflow-hidden rounded-lg text-xs shadow-2 *:col-span-full *:row-span-full">
        <div className="grid place-items-center text-gray-12 dark:text-[#ede0de]">
          {children}
          <h3
            className={joinClasses(
              notoSans.className,
              "text-center text-sm font-bold dark:font-medium",
            )}
          >
            {title}
          </h3>
        </div>
        <div className="-z-10 h-full w-full bg-[var(--gray-1)] opacity-55 transition-colors group-hover:opacity-35 dark:opacity-70 group-hover:dark:opacity-40" />
        <Image
          src={imageSrc}
          alt="company registry"
          className="-z-20 object-cover transition-all group-hover:scale-125"
          fill
          priority
        />
      </div>
    </Link>
  );
}
