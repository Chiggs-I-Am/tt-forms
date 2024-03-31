import SignIn from "@/components/auth/sign-in";
import { DividerHorizontalIcon, FileIcon } from "@radix-ui/react-icons";
import { Button, Card, Heading, Text } from "@radix-ui/themes";
import Link from "next/link";
import React from "react";

export default function Page() {
  return (
    <main className="[grid-area:main/fullbleed]">
      <section className="[grid-area:main]">
        <div className="mx-auto max-w-80 pt-10">
          <SignIn />
        </div>
      </section>
    </main>
  );
}
