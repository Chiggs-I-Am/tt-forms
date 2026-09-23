import type { Metadata } from "next"
import Link from "next/link"
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server"
import { api } from "@workspace/database/api"
import { fetchQuery } from "convex/nextjs"
import { ConvexError } from "convex/values"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Submissions · TT Forms Demo",
}

// Admin submission index (developer-admin only) with a per-form filter. The
// filter rides on the search params so the page stays a Server Component;
// queries run here, mutations nowhere. Detail rendering reuses
// submissions.getSubmission on the [id] page.
async function loadSubmissions(formSlug?: string) {
  const token = await convexAuthNextjsToken()
  try {
    const [submissions, catalog] = await Promise.all([
      fetchQuery(api.admin.listSubmissions, formSlug ? { formSlug } : {}, {
        token,
      }),
      fetchQuery(api.forms.listPublished, {}, { token }),
    ])
    return { submissions, catalog }
  } catch (error) {
    const text =
      error instanceof ConvexError
        ? String(error.data ?? error.message)
        : "The submission list could not be loaded."
    return { denied: text }
  }
}

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ form?: string }>
}) {
  const { form } = await searchParams
  const result = await loadSubmissions(form)

  if ("denied" in result) {
    return (
      <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-4 p-6">
        <h1 className="text-2xl font-medium">Submissions</h1>
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

  const { submissions, catalog } = result

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-3xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-medium">Submissions</h1>
        <p className="text-sm text-muted-foreground">
          Every answer below is invented demo data. Only sign-in emails are
          real. Submissions are read-only; there is no editing from here.
        </p>
      </header>
      <nav aria-label="Filter by form" className="flex flex-wrap gap-2">
        <Button
          variant={form ? "outline" : "default"}
          size="sm"
          nativeButton={false}
          render={<Link href="/admin/submissions" />}
        >
          All forms
        </Button>
        {catalog.map((entry) => (
          <Button
            key={entry.slug}
            variant={form === entry.slug ? "default" : "outline"}
            size="sm"
            nativeButton={false}
            render={<Link href={`/admin/submissions?form=${entry.slug}`} />}
          >
            {entry.name}
          </Button>
        ))}
      </nav>
      {submissions.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No submissions found</CardTitle>
            <CardDescription>
              {form
                ? "Nothing was submitted for this form yet."
                : "Nobody has submitted yet. Run the example seeder and the demo submissions appear here."}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableCaption>
              Newest first. Opening a row shows its fake answers under the
              pinned version.
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Form</TableHead>
                <TableHead scope="col">Applicant</TableHead>
                <TableHead scope="col">Submitted</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((row) => (
                <TableRow key={row.submissionId}>
                  <TableCell>
                    <Link
                      href={`/admin/submissions/${row.submissionId}`}
                      className="font-medium underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                    >
                      {row.formName}
                    </Link>
                    <span className="text-muted-foreground">
                      {" "}
                      · v{row.version}
                    </span>
                  </TableCell>
                  <TableCell>{row.ownerEmail}</TableCell>
                  <TableCell>
                    {new Date(row.submittedAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
