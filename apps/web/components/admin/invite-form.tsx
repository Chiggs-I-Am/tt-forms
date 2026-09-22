"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@workspace/database/api"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { errorText } from "./builder-types"

// Issues one email-bound single-use 7-day invite. The token renders once for
// out-of-band delivery (email or chat) and never again; even this admin
// cannot re-read it afterwards. Mutations live in this client component;
// the page itself stays a querying Server Component (cookie-auth rule).
export function InviteForm() {
  const create = useMutation(api.invites.createInvite)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"developer-admin" | "demo-admin">(
    "demo-admin"
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [issued, setIssued] = useState<{
    email: string
    token: string
    expires: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  async function invite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setCopied(false)
    try {
      const { token } = await create({ email: email.trim(), role })
      setIssued({
        email: email.trim(),
        token,
        expires: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      })
      setEmail("")
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  async function copy() {
    if (!issued) {
      return
    }
    try {
      await navigator.clipboard.writeText(issued.token)
      setCopied(true)
    } catch {
      setError("Copy failed. Select the token text manually.")
    }
  }

  if (issued) {
    return (
      <div className="flex flex-col gap-3 border border-border p-4">
        <h2 className="text-sm font-medium">Invite sent to {issued.email}</h2>
        <p className="text-sm text-muted-foreground">
          Copy this token now and deliver it out of band. It shows once and
          never again, and it expires {issued.expires}.
        </p>
        <p className="border border-dashed border-border bg-muted p-3 font-mono text-xs break-all">
          {issued.token}
        </p>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={() => void copy()}>
            {copied ? "Copied" : "Copy token"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIssued(null)}
          >
            Invite someone else
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={(e) => void invite(e)}
      className="flex flex-col gap-3 border border-dashed border-border p-4"
    >
      <h2 className="text-sm font-medium">Invite an admin</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="invite-email">Email</Label>
          <Input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@example.com"
            autoComplete="off"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="invite-role">Role</Label>
          <Select
            value={role}
            onValueChange={(next) =>
              setRole(next as "developer-admin" | "demo-admin")
            }
          >
            <SelectTrigger id="invite-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="demo-admin">
                Demo-admin (drafts and preview only)
              </SelectItem>
              <SelectItem value="developer-admin">
                Developer-admin (full powers)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Single-use, expires in 7 days, redeemed by signing in with this exact
        email address.
      </p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div>
        <Button type="submit" variant="outline" size="sm" disabled={busy}>
          {busy ? "Inviting…" : "Create invite"}
        </Button>
      </div>
    </form>
  )
}
