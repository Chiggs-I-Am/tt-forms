"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useConvexAuth, useMutation, useQuery } from "convex/react"
import { api } from "@workspace/database/api"
import type { Id } from "@workspace/database/data-model"
import type { Answers } from "@/lib/form-answers"

export type DraftStatus =
  | "local-only"
  | "loading"
  | "synced"
  | "saving"
  | "not-saved"
  | "conflict"
  | "version-pick"

export interface ServerDraftView {
  _id: string
  formId: Id<"forms">
  formVersionId: Id<"formVersions">
  answers: Record<string, unknown>
  status: string
  expiresAt: number
  updatedAt: number
  version: {
    versionId: Id<"formVersions">
    version: number
    status: string
    withdrawReason?: string
  } | null
}

// File objects live in memory only, so strip them before any server save.
// Upload answers travel as storage-id strings (#38); locally they are File
// arrays, which the answers validator would reject.
export function toServerAnswers(local: Answers): Record<string, unknown> {
  const clean: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(local)) {
    if (value instanceof File) {
      continue
    }
    if (Array.isArray(value)) {
      if (value.length > 0 && value[0] instanceof File) {
        clean[key] = []
        continue
      }
      clean[key] = value
      continue
    }
    clean[key] = value
  }
  return clean
}

function stable(value: unknown): string {
  return JSON.stringify(value ?? null)
}

export function diffKeys(
  mine: Record<string, unknown>,
  theirs: Record<string, unknown>
): string[] {
  const keys = new Set([...Object.keys(mine), ...Object.keys(theirs)])
  return [...keys].filter((key) => stable(mine[key]) !== stable(theirs[key]))
}

export function useServerDraft({
  formId,
  versionId,
  localAnswers,
}: {
  formId: Id<"forms"> | null | undefined
  versionId: Id<"formVersions"> | null | undefined
  localAnswers: Answers
}) {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()
  const serverDraft = useQuery(
    api.drafts.getDraft,
    isAuthenticated && formId ? { formId } : "skip"
  ) as ServerDraftView | null | undefined
  const saveDraft = useMutation(api.drafts.saveDraft)
  const replaceDraft = useMutation(api.drafts.replaceDraft)

  const [saveBase, setSaveBase] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [picks, setPicks] = useState<Record<string, "mine" | "server">>({})
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const justSavedRef = useRef(false)

  // Sanitized answers for server comparison and saving. Upload File objects
  // live in memory only and never reach the validator.
  const sanitized = useMemo(
    () => toServerAnswers(localAnswers) as Record<string, unknown>,
    [localAnswers]
  )

  // Merge base for optimistic concurrency. The first load adopts the server
  // timestamp; a save in flight adopts the refreshed timestamp when it
  // arrives. Anything else that moves updatedAt with differing answers means
  // someone else wrote, which the conflict UI resolves.
  useEffect(() => {
    if (justSavedRef.current && serverDraft) {
      justSavedRef.current = false
      setSaveBase(serverDraft.updatedAt)
      return
    }
    if (serverDraft && saveBase === null) {
      setSaveBase(serverDraft.updatedAt)
    }
  }, [serverDraft, saveBase])

  const versionMismatch = useMemo(() => {
    if (!serverDraft || !versionId) {
      return false
    }
    return String(serverDraft.formVersionId) !== String(versionId)
  }, [serverDraft, versionId])

  const serverAnswers = useMemo(
    () => (serverDraft ? (serverDraft.answers as Record<string, unknown>) : {}),
    [serverDraft]
  )

  const differs = useMemo(() => {
    if (!serverDraft) {
      return stable(sanitized) !== stable({})
    }
    return stable(sanitized) !== stable(serverAnswers)
  }, [serverDraft, serverAnswers, sanitized])

  const staleBase = useMemo(() => {
    if (!serverDraft || saveBase === null) {
      return false
    }
    return serverDraft.updatedAt !== saveBase
  }, [serverDraft, saveBase])

  const conflictFields = useMemo(() => {
    if (!serverDraft || versionMismatch || !staleBase) {
      return []
    }
    return diffKeys(sanitized, serverAnswers)
  }, [serverDraft, versionMismatch, staleBase, serverAnswers, sanitized])

  const inConflict = conflictFields.length > 0

  async function persist(options?: { base?: number; retry?: boolean }) {
    if (!formId) {
      return
    }
    setSaving(true)
    if (!options?.retry) {
      setSaveError(null)
    }
    try {
      await saveDraft({
        formId,
        answers: sanitized as never,
        baseUpdatedAt:
          options?.base ?? (serverDraft ? (saveBase ?? undefined) : undefined),
      })
      justSavedRef.current = true
      setSaveError(null)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Autosave failed."
      // A stale base is a merge prompt, not a save error. Keep both copies.
      if (!message.includes("Draft changed elsewhere")) {
        setSaveError(message)
      }
    } finally {
      setSaving(false)
    }
  }

  // Debounced autosave: every ~2s after typing settles, when answers differ
  // and no merge prompt is open. Failures keep answers on screen behind a
  // visible Not saved state with retry.
  useEffect(() => {
    if (
      !isAuthenticated ||
      !formId ||
      serverDraft === undefined ||
      versionMismatch ||
      inConflict
    ) {
      return
    }
    if (!differs) {
      return
    }
    const timer = setTimeout(() => {
      void persist()
    }, 2000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sanitized,
    isAuthenticated,
    formId,
    serverDraft,
    versionMismatch,
    inConflict,
    differs,
  ])

  async function saveMerged() {
    if (!serverDraft || !formId) {
      return
    }
    const merged: Record<string, unknown> = { ...serverAnswers }
    for (const key of conflictFields) {
      merged[key] =
        picks[key] === "server" ? serverAnswers[key] : sanitized[key]
    }
    setSaving(true)
    try {
      await saveDraft({
        formId,
        answers: merged as never,
        baseUpdatedAt: serverDraft.updatedAt,
      })
      justSavedRef.current = true
      setPicks({})
      setSaveError(null)
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Merged save failed."
      )
    } finally {
      setSaving(false)
    }
  }

  async function pickMine() {
    if (!serverDraft || !formId) {
      return
    }
    setSaving(true)
    try {
      await replaceDraft({
        formId,
        answers: sanitized as never,
        retireVersionId: serverDraft.formVersionId,
        confirm: true,
      })
      justSavedRef.current = true
      setConfirmDiscard(false)
      setSaveError(null)
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Version pick failed."
      )
    } finally {
      setSaving(false)
    }
  }

  function adoptServer(appliedUpdatedAt: number) {
    setSaveBase(appliedUpdatedAt)
    setPicks({})
    setConfirmDiscard(false)
    setSaveError(null)
  }

  let status: DraftStatus = "synced"
  if (!isAuthenticated) {
    status = authLoading ? "loading" : "local-only"
  } else if (serverDraft === undefined) {
    status = "loading"
  } else if (versionMismatch) {
    status = "version-pick"
  } else if (inConflict) {
    status = "conflict"
  } else if (saveError) {
    status = "not-saved"
  } else if (saving) {
    status = "saving"
  }

  return {
    status,
    saving,
    serverDraft,
    serverAnswers,
    saveError,
    differs,
    conflictFields,
    picks,
    setPicks,
    confirmDiscard,
    setConfirmDiscard,
    persist,
    saveMerged,
    pickMine,
    adoptServer,
  }
}
