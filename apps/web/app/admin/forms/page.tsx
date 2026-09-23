import type { Metadata } from "next"
import Link from "next/link"
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server"
import { api } from "@workspace/database/api"
import { fetchQuery } from "convex/nextjs"
import { ConvexError } from "convex/values"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { NewForm } from "@/components/admin/new-form"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Form builder · TT Forms Demo",
}

// Developer-admin working-copy index. Queries run in this Server Component
// with the auth token; the Convex denial is the enforcement, and this page
// renders it as an honest notice instead of crashing.
async function loadCopies() {
  try {
    const copies = await fetchQuery(
      api.forms.listWorkingCopies,
      {},
      { token: await convexAuthNextjsToken() }
    )
    return { copies }
  } catch (error) {
    const text =
      error instanceof ConvexError
        ? String(error.data ?? error.message)
        : "The form list could not be loaded."
    return { denied: text }
  }
}

export default async function AdminFormsPage() {
  const result = await loadCopies()

  if ("denied" in result) {
    return (
      <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-4 p-6">
        <h1 className="text-2xl font-medium">Form builder</h1>
        <Card>
          <CardHeader>
            <CardTitle>Developer-admin only</CardTitle>
            <CardDescription>{result.denied}</CardDescription>
          </CardHeader>
        </Card>
        <p className="text-sm text-muted-foreground">
          Button hiding is cosmetic. The server denied this list, so there is
          nothing more to show.{" "}
          <Link href="/signin" className="underline underline-offset-4">
            Sign in
          </Link>{" "}
          with a developer-admin account to continue.
        </p>
      </div>
    )
  }

  const { copies } = result

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-medium">Form builder</h1>
        <p className="text-sm text-muted-foreground">
          One working copy per form. Editing never touches the live version
          until you publish.
        </p>
      </header>
      {copies.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No working copies yet</CardTitle>
            <CardDescription>
              Start one below. Each copy publishes immutable versions that
              applicants fill.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {copies.map((copy) => (
            <li key={copy.slug}>
              <Link
                href={`/admin/forms/${copy.slug}`}
                className="flex gap-4 border border-border bg-card p-4 transition-colors outline-none hover:border-primary focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              >
                <span className="flex flex-1 flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{copy.name}</span>
                    {copy.latestVersion === null ? (
                      <Badge variant="outline">Draft only</Badge>
                    ) : (
                      <Badge
                        variant={
                          copy.latestStatus === "active"
                            ? "default"
                            : copy.latestStatus === "retired"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        v{copy.latestVersion} · {copy.latestStatus}
                      </Badge>
                    )}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {copy.agency} · {copy.slug}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Updated{" "}
                    {new Date(copy.updatedAt).toLocaleDateString("en-TT", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <NewForm />
    </div>
  )
}
