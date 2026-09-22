import type { Metadata } from "next"
import Link from "next/link"
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server"
import { api } from "@workspace/database/api"
import { fetchQuery } from "convex/nextjs"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { ClaimInvite } from "@/components/admin/claim-invite"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Admin · TT Forms Demo",
}

// Role-aware admin landing. The viewer query only decides which links to
// show; every admin mutation and list is denied server-side, so UI gating
// here is cosmetic.
async function loadViewer() {
  const token = await convexAuthNextjsToken()
  if (!token) {
    return null
  }
  try {
    return await fetchQuery(api.users.viewer, {}, { token })
  } catch {
    return null
  }
}

const DEV_LINKS = [
  {
    href: "/admin/forms",
    title: "Form builder",
    description: "Working copies, disposable preview, publish, retire.",
  },
  {
    href: "/admin/applicants",
    title: "Applicants",
    description: "View-only sign-in emails with submission counts.",
  },
  {
    href: "/admin/submissions",
    title: "Submissions",
    description: "Every submitted application with its pinned version.",
  },
  {
    href: "/admin/invites",
    title: "Invites",
    description: "Issue email-bound single-use admin invites.",
  },
]

export default async function AdminPage() {
  const viewer = await loadViewer()

  if (!viewer) {
    return (
      <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-4 p-6">
        <h1 className="text-2xl font-medium">Admin</h1>
        <Card>
          <CardHeader>
            <CardTitle>Sign in first</CardTitle>
            <CardDescription>
              Admin pages need a signed-in account. Admin growth is invite-only:
              a developer-admin invites you by email, you sign in with that
              address, then you claim the invite.
            </CardDescription>
          </CardHeader>
        </Card>
        <p className="text-sm text-muted-foreground">
          <Link href="/signin" className="underline underline-offset-4">
            Sign in
          </Link>{" "}
          to continue.
        </p>
      </div>
    )
  }

  if (viewer.role === "developer-admin") {
    return (
      <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-6 p-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-medium">Admin</h1>
          <p className="text-sm text-muted-foreground">
            Signed in as {viewer.email ?? "a developer-admin"}. Every form
            answer in this demo is invented; only sign-in emails are real.
          </p>
        </header>
        <nav aria-label="Admin sections" className="flex flex-col gap-3">
          {DEV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            >
              <Card>
                <CardHeader>
                  <CardTitle>{link.title}</CardTitle>
                  <CardDescription>{link.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </nav>
      </div>
    )
  }

  if (viewer.role === "demo-admin") {
    return (
      <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-4 p-6">
        <h1 className="text-2xl font-medium">Admin</h1>
        <Card>
          <CardHeader>
            <CardTitle>Demo-admin: drafts and preview only</CardTitle>
            <CardDescription>
              You can draft and preview forms with disposable answers.
              Publishing, retiring, withdrawing, inviting, and viewing
              applicants or submissions stay developer-admin only, enforced by
              the server.
            </CardDescription>
          </CardHeader>
        </Card>
        <p className="text-sm text-muted-foreground">
          <Link href="/forms" className="underline underline-offset-4">
            Browse the forms catalog
          </Link>{" "}
          to open the builder preview.
        </p>
        <ClaimInvite />
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-medium">Admin</h1>
      <Card>
        <CardHeader>
          <CardTitle>Admin access is invite-only</CardTitle>
          <CardDescription>
            This account ({viewer.email ?? "no email on file"}) holds no admin
            role. Ask a developer-admin for an invite sent to your sign-in
            email, then claim it below.
          </CardDescription>
        </CardHeader>
      </Card>
      <ClaimInvite />
    </div>
  )
}
