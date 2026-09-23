"use client"

import { useQuery } from "convex/react"
import { api } from "@workspace/database/api"
import { Badge } from "@workspace/ui/components/badge"

// Live latest-version line. Existing version queries expose version and
// status only, so the full history table waits on a listVersions query; this
// line stays correct after every publish, retire, or withdraw on its own.
export function VersionLine({ slug }: { slug: string }) {
  const latest = useQuery(api.forms.getLatestVersion, { slug })

  if (latest === undefined) {
    return (
      <p className="text-sm text-muted-foreground">Loading version state…</p>
    )
  }

  if (latest === null) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline">Never published</Badge>
        <p className="text-sm text-muted-foreground">
          Saving keeps a working copy only. Publishing snapshots version 1.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge
        variant={
          latest.status === "active"
            ? "default"
            : latest.status === "retired"
              ? "secondary"
              : "outline"
        }
      >
        v{latest.version} · {latest.status}
      </Badge>
      {latest.status === "withdrawn" && latest.withdrawReason && (
        <p className="text-sm text-muted-foreground">{latest.withdrawReason}</p>
      )}
      {latest.status === "retired" && (
        <p className="text-sm text-muted-foreground">
          New drafts stopped. Existing drafts stay submittable until expiry.
        </p>
      )}
    </div>
  )
}
