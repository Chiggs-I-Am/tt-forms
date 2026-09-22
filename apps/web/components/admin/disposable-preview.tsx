"use client"

import { useState } from "react"
import { FormFiller } from "@/components/form-filler"
import type { SectionDef } from "@/lib/form-answers"

// Applicant-style preview with disposable answers. The storage key is unique
// per mount and never reused, so nothing typed here survives leaving the
// page or reaches the server.
export function DisposablePreview({
  slug,
  sections,
}: {
  slug: string
  sections: SectionDef[]
}) {
  const [storageKey] = useState(() => `preview-${slug}-${Date.now()}`)

  if (sections.length === 0) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Add a section above to see the applicant preview.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <p
        role="note"
        className="border border-dashed border-border p-3 text-sm text-muted-foreground"
      >
        Preview, answers are disposable. Nothing here is saved or submitted.
      </p>
      <FormFiller storageKey={storageKey} definition={{ sections }} />
    </div>
  )
}
