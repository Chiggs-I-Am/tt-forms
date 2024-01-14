import AppointmentForm from "@/components/ui/appointment-form";
import ContactCard from "@/components/ui/contact-card";
import FeaturedImage from "@/components/ui/featured-image";
import FeaturedItem from "@/components/ui/featured-item";
import ContactForm from "@/components/ui/form/contact-form";
import { joinClasses } from "@/utils/joinClasses";
import { Heading } from "@radix-ui/themes";
import { Inter_Tight, Noto_Sans } from "next/font/google";

const noto_sans = Noto_Sans({ display: "swap", subsets: ["latin"] });
const interTight = Inter_Tight({ display: "swap", subsets: ["latin"] });

export default function Page() {
  return (
    <main className="[grid-area:main/fullbleed]">
      <section className="mx-auto w-[min(100%,992px)] @container/main [grid-area:main] lg:my-auto">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
          {/* Image */}
          <section className="@md/main:col-span-2">
            <FeaturedImage />
          </section>
          {/* Registries */}
          <section>
            <div className="grid max-w-xl grid-cols-[repeat(2,minmax(90px,1fr))] grid-rows-2 gap-2">
              <FeaturedItem
                href="/registry/company"
                title="Company registry"
                imageSrc="/images/company_registry.png"
              >
                <span className="material-symbols-outlined">
                  store
                </span>
              </FeaturedItem>
              <FeaturedItem
                href="/registry/civil"
                title="Civil registry"
                imageSrc="/images/civil_registry.png"
              >
                <span className="material-symbols-outlined">
                  family_restroom
                </span>
              </FeaturedItem>
              <FeaturedItem
                href="/registry/land"
                title="Land registry"
                imageSrc="/images/land_registry.png"
              >
                <span className="material-symbols-outlined">
                  landscape
                </span>
              </FeaturedItem>
              <FeaturedItem
                href="/registry/digital"
                title="Digital registry"
                imageSrc="/images/digital.avif"
              >
                <span className="material-symbols-outlined">
                  devices
                </span>
              </FeaturedItem>
            </div>
          </section>
          {/* Appointment */}
          <section>
            <div className="grid h-full w-full grid-rows-[auto,1fr,auto] place-items-start gap-2 overflow-hidden rounded-lg px-4 py-2 shadow-2 bg-gray-2">
              <Heading
                as="h2"
                weight="regular"
                className={joinClasses(interTight.className, "text-4")}
              >
                Need to come in?
              </Heading>
              <div className="grid h-full items-center gap-1">
                <p className="text-sm">
                  Come in and get the help you need.
                </p>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined">location_on</span>
                  <p className="text-xs">P. Sherman, 42 Wallaby Way, Sydney.</p>
                </div>
              </div>
              <AppointmentForm />
            </div>
          </section>
          {/* Contact */}
          <section className="@md/main:col-span-2 @3xl:col-span-1 @3xl:col-start-3 @3xl:row-span-2 @3xl:row-start-1">
            <div className="grid h-full grid-rows-[1fr,auto] gap-4">
              <ContactForm />
              <ContactCard
                href="https://github.com/Chiggs-I-Am"
                text="Stephan Wilson"
                description={
                  "Created with ❤ and ⚡ from my wife, daughter, best friends and those that want the best for me: "
                }
                contact={{
                  name: "Stephan Wilson",
                  tag: "Chiggs-I-Am",
                }}
              />
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
