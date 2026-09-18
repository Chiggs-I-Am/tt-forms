import type { Metadata } from "next"
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server"
import { api } from "@workspace/database/api"
import { fetchQuery } from "convex/nextjs"
import { ArrowRight } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { SiteFooter } from "@workspace/ui/components/site-sections"
import { SiteNavbar } from "@workspace/ui/components/site-navbar"
import { AuthStatus } from "@/components/auth-status"
import { pilotForms } from "@/lib/forms"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Browse forms · TT Forms Demo",
}

// Full pilot catalog. Static data, same Server Component pattern as the
// homepage: one viewer query, no mutations, null-on-unreachable-backend.
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

export default async function FormsPage() {
  const viewer = await loadViewer()

  return (
    <div className="flex min-h-svh flex-col">
      <SiteNavbar
        auth={<AuthStatus initialEmail={viewer?.email ?? null} />}
        width="wide"
      />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-12">
        <div className="flex max-w-2xl flex-col gap-2">
          <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            {pilotForms.filter((form) => !form.alternate).length} pilots ·{" "}
            {pilotForms.filter((form) => form.alternate).length} alternate
          </p>
          <h1 className="font-heading text-4xl font-medium text-balance">
            Browse demo forms
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Every form previews its sections with one local-only practice
            field. Official sources are cited on each form page.
          </p>
        </div>
        <ul className="flex max-w-2xl flex-col gap-3">
          {pilotForms.map((form, index) => (
            <li key={form.slug}>
              <a
                href={`/forms/${form.slug}`}
                className="group flex gap-4 border border-border bg-card p-4 transition-colors outline-none hover:border-primary focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              >
                <span
                  aria-hidden="true"
                  className="font-mono text-sm text-muted-foreground"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="flex flex-1 flex-col gap-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-medium group-hover:text-primary">
                      {form.name}
                    </span>
                    {form.alternate ? (
                      <Badge variant="outline">Alternate</Badge>
                    ) : null}
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
