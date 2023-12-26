"use client";

import { Avatar, HoverCard } from "@radix-ui/themes";
import Link from "next/link";

interface ContactCardProps {
  href: string;
  text: string;
  description?: string;
  contact: {
    name: string;
    tag: string;
  };
}

export default function ContactCard({
  href,
  text,
  description,
  contact,
}: ContactCardProps) {
  return (
    <div className="grid w-full p-2 auto-rows-min rounded-lg shadow-md bg-accent-3 text-accent-12 dark:bg-accent-3 dark:text-accent-12">
      <p>
        <span className="text-sm">{description}</span>
        <HoverCard.Root>
          <HoverCard.Trigger>
            <Link
              href={href}
              className="text-sm font-medium hover:underline text-blue-9"
            >
              {text}
            </Link>
          </HoverCard.Trigger>
          <HoverCard.Content>
            <div className="flex w-full gap-4">
              <Avatar size="3" fallback="SW" src="" />
              <div className="flex flex-col justify-between">
                <h4 className="text-sm font-medium">{contact.name}</h4>
                <p className="text-xs">{`@${contact.tag}`}</p>
              </div>
              <p></p>
            </div>
          </HoverCard.Content>
        </HoverCard.Root>
      </p>
    </div>
  );
}
