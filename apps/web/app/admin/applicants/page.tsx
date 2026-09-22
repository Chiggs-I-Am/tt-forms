import type { Metadata } from "next"
import Link from "next/link"
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server"
import { api } from "@workspace/database/api"
import { fetchQuery } from "convex/nextjs"
import { ConvexError } from "convex/values"
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
  title: "Applicants · TT Forms Demo",
}

// View-only applicant list (developer-admin only). The server denial is the
// enforcement; this page renders it as an honest notice instead of crashing.
// Rows carry no actions: no delete, disable, edit, or impersonation exists.
async function loadApplicants() {
  try {
    const applicants = await fetchQuery(
      api.admin.listApplicants,
      {},
      { token: await convexAuthNextjsToken() }
    )
    return { applicants }
  } catch (error) {
    const text =
      error instanceof ConvexError
        ? String(error.data ?? error.message)
        : "The applicant list could not be loaded."
    return { denied: text }
  }
}

export default async function ApplicantsPage() {
  const result = await loadApplicants()

  if ("denied" in result) {
    return (
      <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-4 p-6">
        <h1 className="text-2xl font-medium">Applicants</h1>
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

  const { applicants } = result

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-medium">Applicants</h1>
        <p className="text-sm text-muted-foreground">
          Sign-in emails are real and used only for authentication; every form
          answer is invented.
        </p>
      </header>
      {applicants.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No applicants yet</CardTitle>
            <CardDescription>
              Nobody has signed in on this deployment. Run the example seeder
              and the demo applicants appear here.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableCaption>
              View-only. There is no way to change an applicant from here.
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Email</TableHead>
                <TableHead scope="col">Role</TableHead>
                <TableHead scope="col" className="text-right">
                  Submissions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applicants.map((row) => (
                <TableRow key={row.userId}>
                  <TableCell>{row.email ?? "no email on file"}</TableCell>
                  <TableCell>{row.role}</TableCell>
                  <TableCell className="text-right">
                    {row.submissionCount}
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
