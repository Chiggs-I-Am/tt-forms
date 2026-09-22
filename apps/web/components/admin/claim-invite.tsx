"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@workspace/database/api"
import { Button } from "@workspace/ui/components/button"
import { errorText } from "./builder-types"

// Redeems the caller's invite: sign in with the invited email address through
// the normal Google or OTP flow, then claim here. Shows the granted role on
// success. Client-side only; the server checks the verified email, expiry,
// and single-use.
export function ClaimInvite() {
  const claim = useMutation(api.invites.claimInvite)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [granted, setGranted] = useState<string | null>(null)

  async function run() {
    setBusy(true)
    setError(null)
    try {
      const { role } = await claim({})
      setGranted(role)
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  if (granted) {
    return (
      <p role="status" className="text-sm">
        Invite claimed. Granted role:{" "}
        <span className="font-medium">{granted}</span>
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2 border border-dashed border-border p-4">
      <h2 className="text-sm font-medium">Claim an invite</h2>
      <p className="text-sm text-muted-foreground">
        Signed in with the invited email address? Claim it here. Invites are
        single-use and expire after 7 days.
      </p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => void run()}
        >
          {busy ? "Claiming…" : "Claim invite"}
        </Button>
      </div>
    </div>
  )
}
