"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useConvexAuth, useMutation } from "convex/react"
import { api } from "@workspace/database/api"
import type { Id } from "@workspace/database/data-model"
import { Button, buttonVariants } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"
import type { Answers } from "@/lib/form-answers"
import { toServerAnswers } from "@/components/use-server-draft"

// Submit step for the review screen. Anonymous visitors keep the sign-in
// call to action; signed-in applicants save once more and then submit, so
// the server validates the exact answers on screen. Success shows only
// after Convex confirms, then routes to My applications.
export function SubmitPanel({
  formId,
  localAnswers,
}: {
  formId: Id<"forms"> | null | undefined
  localAnswers: Answers
}) {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useConvexAuth()
  const saveDraft = useMutation(api.drafts.saveDraft)
  const submitDraft = useMutation(api.submissions.submitDraft)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (isLoading) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Checking sign-in.
      </p>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col gap-2 border border-border bg-card p-4">
        <p className="text-sm leading-relaxed">
          Nothing has been sent anywhere. Sign in to keep these answers for the
          first server save.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/signin" className={cn(buttonVariants())}>
            Sign in to save
          </Link>
        </div>
      </div>
    )
  }

  async function onSubmit() {
    if (!formId) {
      setError("The demo backend is unreachable. Try again later.")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await saveDraft({
        formId,
        answers: toServerAnswers(localAnswers) as never,
      })
      await submitDraft({ formId })
      router.push("/applications")
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Submission failed."
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 border border-border bg-card p-4">
      <p className="text-sm leading-relaxed">
        Use fake answers only. Your sign-in email stays with your account and
        never enters the application.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={submitting}
          onClick={() => void onSubmit()}
        >
          {submitting ? "Submitting." : "Submit application"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
