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
import { ClaimInvite } from "@/components/admin/claim-invite"
import { InviteForm } from "@/components/admin/invite-form"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Invites · TT Forms Demo",
}

// Developer-admin invite desk. Tokens never appear here: each token shows
// once inside the create form and is delivered out of band. The server denial
// is the enforcement; this page renders it as an honest notice.
async function loadInvites() {
  try {
    const invites = await fetchQuery(
      api.invites.listInvites,
      {},
      { token: await convexAuthNextjsToken() }
    )
    return { invites }
  } catch (error) {
    const text =
      error instanceof ConvexError
        ? String(error.data ?? error.message)
        : "The invite list could not be loaded."
    return { denied: text }
  }
}

export default async function InvitesPage() {
  const result = await loadInvites()

  if ("denied" in result) {
    return (
      <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-4 p-6">
        <h1 className="text-2xl font-medium">Invites</h1>
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

  const { invites } = result

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-medium">Invites</h1>
        <p className="text-sm text-muted-foreground">
          Email-bound, single-use, 7-day expiry. Recipients sign in with the
          matching address, then claim.
        </p>
      </header>
      <InviteForm />
      {invites.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No invites yet</CardTitle>
            <CardDescription>
              Outstanding invites list here with their expiry and used state.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableCaption>
              Outstanding invites. Tokens show once at creation and never here.
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Email</TableHead>
                <TableHead scope="col">Role</TableHead>
                <TableHead scope="col">Expires</TableHead>
                <TableHead scope="col">State</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.map((row) => (
                <TableRow key={row.inviteId}>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>{row.role}</TableCell>
                  <TableCell>
                    {new Date(row.expiresAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell>{row.usedAt ? "Used" : "Outstanding"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <ClaimInvite />
    </div>
  )
}
