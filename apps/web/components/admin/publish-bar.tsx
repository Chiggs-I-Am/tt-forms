"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@workspace/database/api"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { errorText, type BuilderDraft } from "./builder-types"

// Lifecycle actions. Save writes the working copy, Publish saves then
// snapshots an immutable version, Retire stops new drafts, Withdraw blocks
// submissions with a written reason. Publish errors render the server check
// text verbatim; the server owns every check.
export function PublishBar({
  slug,
  draft,
}: {
  slug: string
  draft: BuilderDraft
}) {
  const save = useMutation(api.forms.saveWorkingCopy)
  const publish = useMutation(api.forms.publish)
  const retire = useMutation(api.forms.retire)
  const withdraw = useMutation(api.forms.withdraw)
  const latest = useQuery(api.forms.getLatestVersion, { slug })
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(
    null
  )
  const [reason, setReason] = useState("")
  const [confirming, setConfirming] = useState<"retire" | "withdraw" | null>(
    null
  )

  async function run(label: string, work: () => Promise<unknown>, ok: string) {
    setBusy(label)
    setNotice(null)
    try {
      await work()
      setNotice({ ok: true, text: ok })
      setConfirming(null)
    } catch (error) {
      setNotice({ ok: false, text: errorText(error) })
    } finally {
      setBusy(null)
    }
  }

  function saveArgs() {
    return { slug, ...draft, definition: { sections: draft.sections } }
  }

  const activeVersionId =
    latest?.status === "active" ? latest.versionId : undefined

  return (
    <div className="flex flex-col gap-3 border border-border bg-card p-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={busy !== null}
          onClick={() =>
            void run("save", () => save(saveArgs()), "Working copy saved.")
          }
        >
          {busy === "save" ? "Saving…" : "Save"}
        </Button>
        <Button
          type="button"
          disabled={busy !== null}
          onClick={() =>
            void run(
              "publish",
              () => save(saveArgs()).then(() => publish({ slug })),
              "Published as a new immutable version."
            )
          }
        >
          {busy === "publish" ? "Publishing…" : "Save and publish"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Publish runs the server checks for invalid rules, missing labels or
        options, and incomplete sources. Anything blocked shows the reason here.
      </p>
      {notice && (
        <p
          role={notice.ok ? "status" : "alert"}
          className={
            notice.ok
              ? "text-sm text-muted-foreground"
              : "text-sm text-destructive"
          }
        >
          {notice.text}
        </p>
      )}
      <div className="flex flex-col gap-2 border-t border-border pt-3">
        {confirming === null ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!activeVersionId || busy !== null}
              onClick={() => setConfirming("retire")}
            >
              Retire latest
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={!activeVersionId || busy !== null}
              onClick={() => setConfirming("withdraw")}
            >
              Withdraw latest
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {confirming === "withdraw" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="withdraw-reason">
                  Public explanation, shown to applicants
                </Label>
                <Input
                  id="withdraw-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why applications closed"
                  autoComplete="off"
                />
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={
                  busy !== null ||
                  !activeVersionId ||
                  (confirming === "withdraw" && reason.trim() === "")
                }
                onClick={() => {
                  const versionId = activeVersionId
                  if (!versionId) {
                    return
                  }
                  if (confirming === "retire") {
                    void run(
                      "retire",
                      () => retire({ versionId }),
                      "Latest version retired. Existing drafts stay submittable."
                    )
                  } else {
                    void run(
                      "withdraw",
                      () => withdraw({ versionId, reason }),
                      "Latest version withdrawn. Submissions are blocked."
                    )
                  }
                }}
              >
                {busy === "retire" || busy === "withdraw"
                  ? "Working…"
                  : `Confirm ${confirming}`}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy !== null}
                onClick={() => setConfirming(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
        {!activeVersionId && (
          <p className="text-xs text-muted-foreground">
            No active version to retire or withdraw.
          </p>
        )}
      </div>
    </div>
  )
}
