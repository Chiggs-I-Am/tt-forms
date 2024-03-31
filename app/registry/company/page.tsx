import { Button, Card, Heading, Inset, Text } from "@radix-ui/themes";
import Image from "next/image";
import Link from "next/link";

export default function Page() {
  return (
    <main className="[grid-area:main/fullbleed]">
      <section className="@container [grid-area:main]">
        <div className="mx-auto max-w-screen-md">
          <Heading mb="3">Company registry forms</Heading>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,280px))] gap-4">
            <Card>
              <Inset clip="padding-box" side="top" pb="current">
                <div className="relative aspect-video w-full">
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
                <Heading as="h2" size="3">
                  Name search reservation
                </Heading>
                <Text as="p" size="2">
                  Lorem ipsum
                </Text>
                <Link
                  href="company/form/name-search-reservation"
                  className="justify-self-end"
                >
                  <Button size="3" variant="soft">
                    Reserve business name
                  </Button>
                </Link>
              </div>
            </Card>
            <Card>
              <Inset clip="padding-box" side="top" pb="current">
                <div className="relative aspect-video w-full">
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
                <Heading as="h2" size="3">
                  Notice of directors
                </Heading>
                <Text as="p" size="2">
                  Lorem ipsum
                </Text>
                <Link
                  href="company/form/notice-of-directors"
                  className="justify-self-end"
                >
                  <Button size="3" variant="soft">
                    Manage directors
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
