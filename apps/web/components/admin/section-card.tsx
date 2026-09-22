"use client"

import { useState } from "react"
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
import { Textarea } from "@workspace/ui/components/textarea"
import {
  blankField,
  earlierChoices,
  FIELD_KINDS,
  type FieldDef,
  type FieldKind,
  type SectionDef,
} from "./builder-types"
import { ConditionBuilder } from "./condition-builder"
import { FieldRow } from "./field-row"
import { RepeatEditor } from "./repeat-editor"

// One ordered section: title, help text, an optional one-level repeat with
// min/max plus repeating-field picks, a condition on earlier answers, and
// its questions. Row-local conditions stay impossible by construction.
export function SectionCard({
  section,
  sections,
  index,
  canUp,
  canDown,
  onChange,
  onRemove,
  onMove,
}: {
  section: SectionDef
  sections: SectionDef[]
  index: number
  canUp: boolean
  canDown: boolean
  onChange: (section: SectionDef) => void
  onRemove: () => void
  onMove: (dir: -1 | 1) => void
}) {
  const [kind, setKind] = useState<FieldKind>("short_text")
  const sectionChoices = earlierChoices(sections, index)

  function set(patch: Partial<SectionDef>) {
    onChange({ ...section, ...patch })
  }

  function setField(i: number, field: FieldDef) {
    set({ fields: section.fields.map((f, j) => (j === i ? field : f)) })
  }

  function moveField(i: number, dir: -1 | 1) {
    const j = i + dir
    const fields = [...section.fields]
    const current = fields[i]
    const other = fields[j]
    if (current === undefined || other === undefined) {
      return
    }
    fields[i] = other
    fields[j] = current
    set({ fields })
  }

  return (
    <div className="flex flex-col gap-4 border border-border bg-card p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${section.id}-sid`}>Section id</Label>
          <Input
            id={`${section.id}-sid`}
            value={section.id}
            onChange={(e) => set({ id: e.target.value })}
            autoComplete="off"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${section.id}-title`}>Title</Label>
          <Input
            id={`${section.id}-title`}
            value={section.title}
            onChange={(e) => set({ title: e.target.value })}
            autoComplete="off"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${section.id}-help`}>Help text, optional</Label>
        <Textarea
          id={`${section.id}-help`}
          value={section.helpText ?? ""}
          onChange={(e) => set({ helpText: e.target.value || undefined })}
          rows={2}
        />
      </div>
      <ConditionBuilder
        idPrefix={section.id}
        condition={section.condition}
        choices={sectionChoices}
        onChange={(condition) => set({ condition })}
      />
      <RepeatEditor section={section} onChange={set} />
      <div className="flex flex-col gap-3">
        {section.fields.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No questions yet. Publish blocks empty sections.
          </p>
        )}
        {section.fields.map((field, i) => (
          <FieldRow
            key={field.id || i}
            field={field}
            choices={earlierChoices(sections, index, i)}
            canUp={i > 0}
            canDown={i < section.fields.length - 1}
            onChange={(next) => setField(i, next)}
            onRemove={() =>
              set({ fields: section.fields.filter((_, j) => j !== i) })
            }
            onMove={(dir) => moveField(i, dir)}
          />
        ))}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor={`${section.id}-newkind`}>New question type</Label>
          <Select value={kind} onValueChange={(v) => setKind(v as FieldKind)}>
            <SelectTrigger id={`${section.id}-newkind`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIELD_KINDS.map((k) => (
                <SelectItem key={k.kind} value={k.kind}>
                  {k.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => set({ fields: [...section.fields, blankField(kind)] })}
        >
          Add question
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!canUp}
          onClick={() => onMove(-1)}
        >
          Move section up
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!canDown}
          onClick={() => onMove(1)}
        >
          Move section down
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          Delete section
        </Button>
      </div>
    </div>
  )
}
