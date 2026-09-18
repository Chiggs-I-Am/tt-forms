import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server"
import { api } from "@workspace/database/api"
import { fetchQuery } from "convex/nextjs"
import { FormSearch } from "@workspace/ui/components/form-search"
import {
  HowItWorks,
  OfficialSources,
  SiteFooter,
} from "@workspace/ui/components/site-sections"
import { SiteNavbar } from "@workspace/ui/components/site-navbar"
import { AuthStatus } from "@/components/auth-status"
import { pilotForms } from "@/lib/forms"

export const dynamic = "force-dynamic"

// Landing page: navbar, hero search band, then steps and official sources.
// This Server Component performs one query (the viewer) and no mutations,
// per the cookie-auth rule. When the backend is unreachable the page renders
// the anonymous homepage instead of crashing; browsing never needs the
// server.
async function loadViewer() {
  try {
    return await fetchQuery(
      api.users.viewer,
      {},
      { token: await convexAuthNextjsToken() }
    )
  } catch {
    return null
  }
}

export default async function Page() {
  const viewer = await loadViewer()

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
      <SiteNavbar
        auth={<AuthStatus initialEmail={viewer?.email ?? null} />}
        width="wide"
      />
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
