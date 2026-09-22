"use client"

import Link from "next/link"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Label } from "@workspace/ui/components/label"
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group"
import type { Id } from "@workspace/database/data-model"
import type { Answers } from "@/lib/form-answers"
import { useServerDraft } from "@/components/use-server-draft"

function formatPreview(value: unknown): string {
  if (value === undefined || value === null || value === "") {
    return "Empty"
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No"
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "Empty"
    }
    if (value.some((item) => typeof item === "object")) {
      return `${value.length} ${value.length === 1 ? "entry" : "entries"}`
    }
    return value.join(", ")
  }
  if (typeof value === "object") {
    return JSON.stringify(value)
  }
  return String(value)
}

function expiryLine(expiresAt: number): string {
  return `Draft expires ${new Date(expiresAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}`
}

// Server-draft sync panel for the applicant fill view. Anonymous visitors
// stay local-only; signed-in applicants autosave to one draft per form with
// merge prompts instead of silent overwrites or silent version moves.
export function DraftSync({
  formId,
  versionId,
  localAnswers,
  labels,
  onApplyAnswers,
}: {
  formId: Id<"forms"> | null | undefined
  versionId: Id<"formVersions"> | null | undefined
  localAnswers: Answers
  labels?: Record<string, string>
  onApplyAnswers: (answers: Answers) => void
}) {
  const sync = useServerDraft({ formId, versionId, localAnswers })
  const labelFor = (key: string) => labels?.[key] ?? key

  if (sync.status === "local-only" || sync.status === "loading") {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        {sync.status === "loading"
          ? "Checking your saved draft."
          : "Saved in this browser only. "}
        {sync.status === "local-only" && (
          <Link href="/signin" className="underline underline-offset-4">
            Sign in to save online
          </Link>
        )}
      </p>
    )
  }

  if (sync.status === "version-pick" && sync.serverDraft) {
    const server = sync.serverAnswers
    return (
      <Card role="status">
        <CardHeader>
          <CardTitle>Which draft do you want to keep?</CardTitle>
          <CardDescription>
            Your saved draft is on version{" "}
            {sync.serverDraft.version?.version ?? "?"} and this form now shows a
            newer version. Nothing moves on its own.{" "}
            {expiryLine(sync.serverDraft.expiresAt)}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">Saved draft answers</p>
              {Object.keys(server).length === 0 && (
                <p className="text-sm text-muted-foreground">Empty</p>
              )}
              {Object.entries(server).map(([key, value]) => (
                <p key={key} className="text-sm">
                  <span className="text-muted-foreground">
                    {labelFor(key)}:{" "}
                  </span>
                  {formatPreview(value)}
                </p>
              ))}
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">What you just typed</p>
              {Object.keys(localAnswers).length === 0 && (
                <p className="text-sm text-muted-foreground">Empty</p>
              )}
              {Object.entries(localAnswers).map(([key, value]) => (
                <p key={key} className="text-sm">
                  <span className="text-muted-foreground">
                    {labelFor(key)}:{" "}
                  </span>
                  {formatPreview(value)}
                </p>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="discard-local"
              checked={sync.confirmDiscard}
              onCheckedChange={(checked) =>
                sync.setConfirmDiscard(checked === true)
              }
            />
            <Label htmlFor="discard-local">
              Discard what I just typed and continue with the saved draft
            </Label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!sync.confirmDiscard || sync.saving}
              onClick={() => {
                onApplyAnswers(sync.serverAnswers as Answers)
                sync.adoptServer(sync.serverDraft!.updatedAt)
              }}
            >
              Pick saved draft
            </Button>
            <Button
              type="button"
              disabled={sync.saving}
              onClick={() => void sync.pickMine()}
            >
              {sync.saving ? "Saving." : "Pick what I just typed"}
            </Button>
          </div>
          {sync.saveError && (
            <p role="alert" className="text-sm text-destructive">
              {sync.saveError}
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  if (sync.status === "conflict" && sync.serverDraft) {
    const server = sync.serverAnswers
    const mine = localAnswers as Record<string, unknown>
    return (
      <Card role="status">
        <CardHeader>
          <CardTitle>Merge your answers</CardTitle>
          <CardDescription>
            This draft changed elsewhere. Pick an answer per field, then save
            the merged draft. Neither copy is discarded until that save lands.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sync.conflictFields.map((key) => {
            const pick = sync.picks[key] ?? "mine"
            return (
              <div
                key={key}
                className="flex flex-col gap-2 border-t border-border pt-3"
              >
                <p className="text-sm font-medium">{labelFor(key)}</p>
                <RadioGroup
                  value={pick}
                  onValueChange={(value) =>
                    sync.setPicks((prev) => ({
                      ...prev,
                      [key]: value as "mine" | "server",
                    }))
                  }
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="mine" id={`${key}-mine`} />
                    <Label htmlFor={`${key}-mine`}>
                      Mine: {formatPreview(mine[key])}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="server" id={`${key}-server`} />
                    <Label htmlFor={`${key}-server`}>
                      Saved: {formatPreview(server[key])}
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )
          })}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={sync.saving}
              onClick={() => void sync.saveMerged()}
            >
              {sync.saving ? "Saving." : "Save merged draft"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {expiryLine(sync.serverDraft.expiresAt)}
          </p>
          {sync.saveError && (
            <p role="alert" className="text-sm text-destructive">
              {sync.saveError}
            </p>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div role="status" className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {sync.status === "not-saved" ? (
        <>
          <p className="text-sm font-medium text-destructive">Not saved</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={sync.saving}
            onClick={() =>
              void sync.persist({
                base: sync.serverDraft?.updatedAt,
                retry: true,
              })
            }
          >
            Retry
          </Button>
          {sync.saveError && (
            <p className="text-xs text-muted-foreground">{sync.saveError}</p>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          {sync.saving
            ? "Saving."
            : sync.differs
              ? "Unsaved changes."
              : "All changes saved."}
        </p>
      )}
      {sync.serverDraft && (
        <p className="text-xs text-muted-foreground">
          {expiryLine(sync.serverDraft.expiresAt)}
        </p>
      )}
    </div>
  )
}
