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
import type { ChoiceOption, Condition } from "./builder-types"

// Condition builder: all/any matching over earlier choice answers. Values
// are comma-separated answer strings; yes/no answers compare as true/false.
// The server re-checks every reference at publish time.
export function ConditionBuilder({
  idPrefix,
  condition,
  choices,
  onChange,
}: {
  idPrefix: string
  condition: Condition | undefined
  choices: ChoiceOption[]
  onChange: (condition: Condition | undefined) => void
}) {
  if (!condition) {
    const first = choices[0]
    return (
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <Checkbox
          checked={false}
          onCheckedChange={() =>
            onChange({
              mode: "any",
              rules: first ? [{ fieldId: first.id, values: [] }] : [],
            })
          }
        />
        Show only when an earlier answer matches
      </label>
    )
  }

  const active = condition
  const firstChoice = choices[0]

  function setRule(index: number, rule: { fieldId: string; values: string[] }) {
    const rules = active.rules.map((r, i) => (i === index ? rule : r))
    onChange({ ...active, rules })
  }

  return (
    <div className="flex flex-col gap-3 border border-dashed border-border p-3">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox
            checked={true}
            onCheckedChange={() => onChange(undefined)}
          />
          Conditional
        </label>
        <div className="flex items-center gap-2">
          <Label htmlFor={`${idPrefix}-mode`}>Match</Label>
          <Select
            value={active.mode}
            onValueChange={(value) =>
              onChange({ ...active, mode: value === "all" ? "all" : "any" })
            }
          >
            <SelectTrigger id={`${idPrefix}-mode`} size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">any answer</SelectItem>
              <SelectItem value="all">all answers</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {choices.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No earlier choice question exists yet. Add a single choice, multiple
          choice, or yes/no question above first.
        </p>
      )}
      {active.rules.map((rule, index) => {
        const target = choices.find((c) => c.id === rule.fieldId)
        return (
          <div key={index} className="flex flex-col gap-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor={`${idPrefix}-rule-${index}-field`}>
                  Earlier question
                </Label>
                <Select
                  value={rule.fieldId}
                  onValueChange={(fieldId) => {
                    if (typeof fieldId === "string") {
                      setRule(index, { fieldId, values: [] })
                    }
                  }}
                >
                  <SelectTrigger id={`${idPrefix}-rule-${index}-field`}>
                    <SelectValue placeholder="Pick a question" />
                  </SelectTrigger>
                  <SelectContent>
                    {choices.map((choice) => (
                      <SelectItem key={choice.id} value={choice.id}>
                        {choice.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor={`${idPrefix}-rule-${index}-values`}>
                  Matching answers, comma separated
                </Label>
                <Input
                  id={`${idPrefix}-rule-${index}-values`}
                  value={rule.values.join(", ")}
                  onChange={(event) =>
                    setRule(index, {
                      ...rule,
                      values: event.target.value
                        .split(",")
                        .map((v) => v.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder={target ? target.options.join(", ") : "…"}
                  autoComplete="off"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  onChange({
                    ...active,
                    rules: active.rules.filter((_, i) => i !== index),
                  })
                }
              >
                Remove
              </Button>
            </div>
            {target && (
              <p className="text-xs text-muted-foreground">
                Available answers: {target.options.join(", ")}
              </p>
            )}
          </div>
        )
      })}
      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={choices.length === 0}
          onClick={() => {
            if (!firstChoice) {
              return
            }
            onChange({
              ...active,
              rules: [...active.rules, { fieldId: firstChoice.id, values: [] }],
            })
          }}
        >
          Add rule
        </Button>
      </div>
    </div>
  )
}
