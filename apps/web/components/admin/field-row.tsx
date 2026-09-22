"use client"

import { Button } from "@workspace/ui/components/button"
import { Checkbox } from "@workspace/ui/components/checkbox"
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
  FIELD_KINDS,
  type ChoiceOption,
  type FieldDef,
} from "./builder-types"
import { ConditionBuilder } from "./condition-builder"
import { KindRules } from "./rule-inputs"

// One question with only the rule inputs its kind supports. Built-in rules
// only: required, length/range, date bounds, upload size. The server owns
// every check; this form never invents new rule types.
export function FieldRow({
  field,
  choices,
  canUp,
  canDown,
  onChange,
  onRemove,
  onMove,
}: {
  field: FieldDef
  choices: ChoiceOption[]
  canUp: boolean
  canDown: boolean
  onChange: (field: FieldDef) => void
  onRemove: () => void
  onMove: (dir: -1 | 1) => void
}) {
  function set(patch: Partial<FieldDef>) {
    onChange({ ...field, ...patch } as FieldDef)
  }

  function changeKind(kind: FieldDef["kind"]) {
    const fresh = blankField(kind)
    onChange({
      ...fresh,
      id: field.id,
      label: field.label,
      hint: field.hint,
      required: field.required,
      condition: field.condition,
    } as FieldDef)
  }

  return (
    <div className="flex flex-col gap-3 border border-border p-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${field.id}-kind`}>Type</Label>
          <Select
            value={field.kind}
            onValueChange={(value) => changeKind(value as FieldDef["kind"])}
          >
            <SelectTrigger id={`${field.id}-kind`}>
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
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${field.id}-id`}>Field id</Label>
          <Input
            id={`${field.id}-id`}
            value={field.id}
            onChange={(e) => set({ id: e.target.value })}
            autoComplete="off"
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${field.id}-label`}>Label</Label>
        <Input
          id={`${field.id}-label`}
          value={field.label}
          onChange={(e) => set({ label: e.target.value })}
          autoComplete="off"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${field.id}-hint`}>Hint, optional</Label>
        <Textarea
          id={`${field.id}-hint`}
          value={field.hint ?? ""}
          onChange={(e) => set({ hint: e.target.value || undefined })}
          rows={2}
        />
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <Checkbox
          checked={field.required === true}
          onCheckedChange={(checked) => set({ required: checked === true })}
        />
        Required
      </label>
      <KindRules field={field} onChange={set} />
      <ConditionBuilder
        idPrefix={field.id}
        condition={field.condition}
        choices={choices}
        onChange={(condition) => set({ condition })}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!canUp}
          onClick={() => onMove(-1)}
        >
          Move up
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={!canDown}
          onClick={() => onMove(1)}
        >
          Move down
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          Delete question
        </Button>
      </div>
    </div>
  )
}
