"use client"

import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import type { BuilderDraft } from "./builder-types"

type Meta = Pick<BuilderDraft, "name" | "agency" | "sourceLabel" | "sourceUrl">

// Working-copy header: name, agency, and the official source publish checks
// require. Edits stay local until Save.
export function MetaFields({
  meta,
  onChange,
}: {
  meta: Meta
  onChange: (meta: Meta) => void
}) {
  function set(key: keyof Meta, value: string) {
    onChange({ ...meta, [key]: value })
  }

  return (
    <section
      aria-label="Form details"
      className="grid grid-cols-1 gap-4 md:grid-cols-2"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="meta-name">Form name</Label>
        <Input
          id="meta-name"
          value={meta.name}
          onChange={(event) => set("name", event.target.value)}
          autoComplete="off"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="meta-agency">Agency</Label>
        <Input
          id="meta-agency"
          value={meta.agency}
          onChange={(event) => set("agency", event.target.value)}
          autoComplete="off"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="meta-source-label">Official source label</Label>
        <Input
          id="meta-source-label"
          value={meta.sourceLabel}
          onChange={(event) => set("sourceLabel", event.target.value)}
          placeholder="TTPS Certificate of Character portal"
          autoComplete="off"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="meta-source-url">Official source URL</Label>
        <Input
          id="meta-source-url"
          value={meta.sourceUrl}
          onChange={(event) => set("sourceUrl", event.target.value)}
          inputMode="url"
          placeholder="https://…"
          autoComplete="off"
        />
      </div>
      <p className="text-sm text-muted-foreground md:col-span-2">
        Publishing blocks when the source is incomplete. Applicants see this
        citation on the live form.
      </p>
    </section>
  )
}
