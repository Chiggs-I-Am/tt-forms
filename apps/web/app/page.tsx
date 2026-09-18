import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server"
import { api } from "@workspace/database/api"
import { fetchQuery } from "convex/nextjs"
import { AuthStatus } from "@/components/auth-status"
import { TryItLocal } from "@/components/try-it-local"

export const dynamic = "force-dynamic"

// Landing page for #34: anonymous browsing, local-only answers, and the
// sign-in-to-save gate. This Server Component performs one query (the viewer)
// and no mutations, per the cookie-auth rule. When the backend is unreachable
// (e.g. no `convex dev` running), the page renders the anonymous landing
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

export default async function Page() {
  const viewer = await loadViewer()

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <p className="text-xs tracking-widest text-muted-foreground uppercase">
          Demo · not a government service
        </p>
        <AuthStatus initialEmail={viewer?.email ?? null} />
      </header>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium">
          Trinidad and Tobago forms, online
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A hands-on demonstration of what completing government paperwork
          online could feel like. Applications save to this demo&apos;s own
          database. Nothing here reaches any government office.
        </p>
      </div>

      <TryItLocal />

      <div className="flex flex-col gap-2">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {viewer
            ? "You are signed in, so your next step can save to the server. The full applicant flow arrives in the next ticket."
            : "When you are ready to save, sign in with Google or an email code. Your email is real and only used to sign you in; every form answer must be fake."}
        </p>
        {!viewer && (
          <a
            href="/signin"
            className="text-sm font-medium underline underline-offset-4"
          >
            Continue to sign-in
          </a>
        )}
      </div>
    </div>
  )
}
