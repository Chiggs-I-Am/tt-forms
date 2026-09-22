"use client"

import { Checkbox } from "@workspace/ui/components/checkbox"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import type { SectionDef } from "./builder-types"

function num(value: string, fallback: number): number {
  const parsed = Number(value)
  return value.trim() === "" || Number.isNaN(parsed) ? fallback : parsed
}

// One-level repeat: min/max entry counts plus the repeating-field picks.
// Unticked picks mean every question repeats; ticking a subset asks the rest
// once above the rows. The server rejects row-local conditions at publish.
export function RepeatEditor({
  section,
  onChange,
}: {
  section: SectionDef
  onChange: (patch: Partial<SectionDef>) => void
}) {
  if (!section.repeat) {
    return (
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <Checkbox
          checked={false}
          onCheckedChange={() => onChange({ repeat: { min: 1, max: 2 } })}
        />
        Repeatable group, applicants answer it more than once
      </label>
    )
  }

  const repeat = section.repeat
  return (
    <div className="flex flex-col gap-3 border border-dashed border-border p-3">
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <Checkbox
          checked={true}
          onCheckedChange={() =>
            onChange({ repeat: undefined, repeatFields: undefined })
          }
        />
        Repeatable group
      </label>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${section.id}-rmin`}>Minimum entries</Label>
          <Input
            id={`${section.id}-rmin`}
            inputMode="numeric"
            value={repeat.min.toString()}
            onChange={(e) =>
              onChange({
                repeat: { min: num(e.target.value, 0), max: repeat.max },
              })
            }
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${section.id}-rmax`}>Maximum entries</Label>
          <Input
            id={`${section.id}-rmax`}
            inputMode="numeric"
            value={repeat.max.toString()}
            onChange={(e) =>
              onChange({
                repeat: { min: repeat.min, max: num(e.target.value, 1) },
              })
            }
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Exactly two references means minimum 2 and maximum 2. Tick only some
        questions to ask the rest once above the rows. Unticked means every
        question repeats.
      </p>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold tracking-wide uppercase">
          Repeating questions
        </span>
        {section.fields.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Add questions first, then pick which ones repeat.
          </p>
        )}
        {section.fields.map((field) => {
          const checked =
            section.repeatFields === undefined ||
            section.repeatFields.includes(field.id)
          return (
            <label
              key={field.id || field.label}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <Checkbox
                checked={section.repeatFields === undefined ? true : checked}
                onCheckedChange={(on) => {
                  const ids = new Set(
                    section.repeatFields ?? section.fields.map((f) => f.id)
                  )
                  if (on === true) {
                    ids.add(field.id)
                  } else {
                    ids.delete(field.id)
                  }
                  const next = [...ids]
                  onChange({
                    repeatFields:
                      next.length === section.fields.length ? undefined : next,
                  })
                }}
              />
              {field.label || field.id}
            </label>
          )
        })}
      </div>
    </div>
  )
}
