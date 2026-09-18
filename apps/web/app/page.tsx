import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server"
import { api } from "@workspace/database/api"
import Link from "next/link"
import { fetchQuery } from "convex/nextjs"
import { AuthStatus } from "@/components/auth-status"
import { FormSearch } from "@/components/form-search"

export const dynamic = "force-dynamic"

// Landing page for #34: a searchable catalog of the pilot forms, the
// sign-in-to-save gate, and the demo safeguards. This Server Component
// performs one query (the viewer) and no mutations, per the cookie-auth rule.
// When the backend is unreachable the page renders the anonymous landing
// instead of crashing; browsing never needs the server.
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

const steps = [
  {
    title: "Find your form",
    body: "Search the three pilot forms below. Each one cites the official government source it is modeled on.",
  },
  {
    title: "Try it locally, no account",
    body: "Open a form and type into the practice field. Answers stay in this browser only, with a backup that survives sign-in.",
  },
  {
    title: "Sign in to save",
    body: "Google or an email code, one account per address. The first server save requires sign-in; the full application flow arrives next.",
  },
]

export default async function Page() {
  const viewer = await loadViewer()

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-xl flex-col gap-10 p-6">
      <header className="flex items-start justify-between gap-4">
        <p className="text-xs tracking-widest text-muted-foreground uppercase">
          Demo · not a government service
        </p>
        <AuthStatus initialEmail={viewer?.email ?? null} />
      </header>

      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-medium">
          Trinidad and Tobago forms, filled in online
        </h1>
        <p className="leading-relaxed text-muted-foreground">
          A hands-on demonstration of what completing government paperwork
          online could feel like. Find a form, try it with invented details, and
          sign in when you want to save. Applications live in this demo&apos;s
          own database. Nothing here reaches any government office.
        </p>
      </div>

      <FormSearch />

      <section aria-labelledby="how" className="flex flex-col gap-4">
        <h2 id="how" className="text-lg font-medium">
          How the demo works
        </h2>
        <ol className="flex flex-col gap-4">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-4">
              <span
                aria-hidden="true"
                className="font-mono text-sm text-muted-foreground"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
        {!viewer && (
          <Link
            href="/signin"
            className="text-sm font-medium underline underline-offset-4"
          >
            Continue to sign-in
          </Link>
        )}
      </section>

      <footer className="flex flex-col gap-2 border-t border-border pt-4 pb-2">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Your sign-in email is real and only used for authentication. Every
          form answer must be fake. Never type real ID numbers or personal
          details into this demo.
        </p>
      </footer>
    </div>
  )
}
