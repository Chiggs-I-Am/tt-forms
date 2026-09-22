import type { Metadata } from "next"
import { ArrowRight } from "lucide-react"
import { SiteFooter } from "@workspace/ui/components/site-sections"
import { pilotForms } from "@/lib/forms"

export const metadata: Metadata = {
  title: "Browse forms · TT Forms Demo",
}

// Full pilot catalog. Static data; the navbar is global (see layout).

export default async function FormsPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-12">
        <div className="flex max-w-2xl flex-col gap-2">
          <h1 className="font-heading text-4xl font-medium text-balance">
            Browse demo forms
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Demonstration only. Nothing typed here reaches the government; every
            answer must be fake.
          </p>
        </div>
        <ul className="flex max-w-2xl flex-col gap-3">
          {pilotForms.map((form) => (
            <li key={form.slug}>
              <a
                href={`/forms/${form.slug}`}
                className="group flex gap-4 border border-border bg-card p-4 transition-colors outline-none hover:border-primary focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              >
                <span className="flex flex-1 flex-col gap-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-medium">{form.name}</span>
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {form.agency}
                  </span>
                  <span className="text-sm leading-relaxed">
                    {form.summary}
                  </span>
                  <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest text-primary uppercase">
                    Open form
                    <ArrowRight
                      aria-hidden="true"
                      className="size-3.5 transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </main>
      <div className="mx-auto w-full max-w-5xl px-6">
        <SiteFooter />
      </div>
    </div>
  )
}
