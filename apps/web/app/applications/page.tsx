import Link from "next/link"
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server"
import { api } from "@workspace/database/api"
import { fetchQuery } from "convex/nextjs"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "My applications · TT Forms Demo",
}

// Read-only list of the signed-in applicant's submissions, newest first.
// Queries run in this Server Component under the cookie-auth rule; signed-out
// visitors get the sign-in prompt and never a row.
export default async function ApplicationsPage() {
  const token = await convexAuthNextjsToken()
  if (!token) {
    return (
      <div className="mx-auto flex min-h-svh w-full max-w-xl flex-col gap-4 p-6">
        <h1 className="text-2xl font-medium">My applications</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Sign in to see the applications you submitted.
        </p>
        <Link
          href="/signin"
          className="text-sm font-medium underline underline-offset-4"
        >
          Sign in
        </Link>
      </div>
    )
  }

  let submissions
  try {
    submissions = await fetchQuery(api.submissions.mySubmissions, {}, { token })
  } catch {
    return (
      <div className="mx-auto flex min-h-svh w-full max-w-xl flex-col gap-4 p-6">
        <h1 className="text-2xl font-medium">My applications</h1>
        <p role="alert" className="text-sm text-destructive">
          Your applications could not be loaded. The demo backend may be
          unreachable.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-medium">My applications</h1>
        <p className="text-sm text-muted-foreground">
          Submitted applications are read-only. Starting a new draft of the same
          form is allowed from its form page.
        </p>
      </header>

      {submissions.length === 0 ? (
        <div
          role="status"
          className="flex flex-col gap-2 border border-dashed border-border p-6"
        >
          <p className="text-sm font-medium">No applications yet.</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Fill a form and submit it. It will appear here once Convex confirms
            the submission.
          </p>
          <Link
            href="/forms"
            className="text-sm font-medium underline underline-offset-4"
          >
            Browse forms
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {submissions.map((submission) => (
            <li key={submission.submissionId}>
              <Card>
                <CardHeader>
                  <CardTitle>
                    <Link
                      href={`/applications/${submission.submissionId}`}
                      className="underline underline-offset-4"
                    >
                      {submission.formName}
                    </Link>
                  </CardTitle>
                  <CardDescription>
                    Version {submission.version} · Submitted{" "}
                    {new Date(submission.submittedAt).toLocaleDateString(
                      undefined,
                      { year: "numeric", month: "short", day: "numeric" }
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge
                    variant={
                      submission.versionStatus === "active"
                        ? "outline"
                        : "secondary"
                    }
                  >
                    {submission.versionStatus === "active"
                      ? "Submitted"
                      : `Version ${submission.versionStatus}`}
                  </Badge>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
