import { FormSearch } from "@workspace/ui/components/form-search"
import {
  HowItWorks,
  OfficialSources,
  SiteFooter,
} from "@workspace/ui/components/site-sections"
import { pilotForms } from "@/lib/forms"

// Landing page: hero search band, then steps and official sources. The
// navbar is global (see layout); this page is static and server-mutation
// free.

export default async function Page() {
  const forms = pilotForms.map((form) => ({
    slug: form.slug,
    name: form.name,
    agency: form.agency,
    summary: form.summary,
    alternate: form.alternate,
  }))
  const sources = pilotForms.map((form) => ({
    agency: form.agency,
    label: form.sourceLabel,
    url: form.sourceUrl,
  }))

  return (
    <div className="flex min-h-svh flex-col">
      <main className="flex flex-1 flex-col">
        <section className="border-b border-border bg-muted/50">
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-14 text-center">
            <h1 className="font-heading text-4xl font-medium text-balance">
              Which form do you need?
            </h1>
            <FormSearch
              forms={forms}
              size="hero"
              suggestions={["passport", "police", "birth"]}
              className="text-left"
            />
          </div>
        </section>
        <div className="mx-auto grid w-full max-w-5xl flex-1 gap-10 px-6 py-12 md:grid-cols-2">
          <HowItWorks layout="rows" />
          <OfficialSources sources={sources} />
        </div>
      </main>
      <div className="mx-auto w-full max-w-5xl px-6">
        <SiteFooter />
      </div>
    </div>
  )
}
