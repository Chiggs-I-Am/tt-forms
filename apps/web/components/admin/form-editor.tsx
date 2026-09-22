"use client"

import { useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { blankSection, type BuilderDraft } from "./builder-types"
import { DisposablePreview } from "./disposable-preview"
import { MetaFields } from "./meta-fields"
import { PublishBar } from "./publish-bar"
import { SectionCard } from "./section-card"
import { VersionLine } from "./version-line"

// The structured builder: working-copy meta, ordered sections with
// conditions and repeats, kind-matched rule inputs, lifecycle actions, a
// live version line, and a disposable applicant preview. Everything edits
// local state until Save; the server owns every check at publish time.
export function FormEditor({
  slug,
  initial,
}: {
  slug: string
  initial: BuilderDraft
}) {
  const [draft, setDraft] = useState<BuilderDraft>(initial)

  function moveSection(index: number, dir: -1 | 1) {
    const next = index + dir
    const sections = [...draft.sections]
    const current = sections[index]
    const other = sections[next]
    if (next < 0 || current === undefined || other === undefined) {
      return
    }
    sections[index] = other
    sections[next] = current
    setDraft({ ...draft, sections })
  }

  return (
    <div className="flex flex-col gap-8">
      <VersionLine slug={slug} />
      <MetaFields
        meta={draft}
        onChange={(meta) => setDraft({ ...draft, ...meta })}
      />
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Sections</h2>
        {draft.sections.length === 0 && (
          <p role="status" className="text-sm text-muted-foreground">
            No sections yet. Applicants see one section at a time, so start with
            the first page of the paper form.
          </p>
        )}
        {draft.sections.map((section, i) => (
          <SectionCard
            key={section.id || i}
            section={section}
            sections={draft.sections}
            index={i}
            canUp={i > 0}
            canDown={i < draft.sections.length - 1}
            onChange={(next) =>
              setDraft({
                ...draft,
                sections: draft.sections.map((s, j) => (j === i ? next : s)),
              })
            }
            onRemove={() =>
              setDraft({
                ...draft,
                sections: draft.sections.filter((_, j) => j !== i),
              })
            }
            onMove={(dir) => moveSection(i, dir)}
          />
        ))}
        <div>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              setDraft({
                ...draft,
                sections: [...draft.sections, blankSection()],
              })
            }
          >
            Add section
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Publish</h2>
        <PublishBar slug={slug} draft={draft} />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Preview</h2>
        <DisposablePreview slug={slug} sections={draft.sections} />
      </div>
    </div>
  )
}
