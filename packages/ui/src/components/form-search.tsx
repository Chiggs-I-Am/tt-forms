"use client"

import { Combobox } from "@base-ui/react/combobox"
import { ArrowRight } from "lucide-react"
import { useMemo, useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { cn } from "cn"

export interface FormSummary {
  slug: string
  name: string
  agency: string
  summary: string
  alternate?: boolean
}

function matches(form: FormSummary, query: string) {
  const haystack = [form.name, form.agency, form.summary]
    .join(" ")
    .toLowerCase()
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word))
}

// Homepage search. Results float in a dropdown under the input instead of
// pushing the page down; the list only opens once the visitor types. Catalog
// order (and its numerals) stays stable under any filter.
export function FormSearch({
  forms,
  id = "form-search",
  suggestions = [],
  size = "default",
  className,
}: {
  forms: FormSummary[]
  id?: string
  suggestions?: string[]
  size?: "default" | "hero"
  className?: string
}) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const searching = query.trim().length > 0
  const results = useMemo(
    () => (searching ? forms.filter((form) => matches(form, query)) : []),
    [forms, query, searching]
  )

  function clear() {
    setQuery("")
    setOpen(false)
  }

  function suggest(value: string) {
    setQuery(value)
    setOpen(true)
  }

  return (
    <Combobox.Root<string>
      inputValue={query}
      onInputValueChange={(value) => {
        setQuery(value)
        setOpen(true)
      }}
      open={searching && open}
      onOpenChange={(next) => setOpen(next)}
      filter={null}
      onValueChange={(slug) => {
        // Clearing the input resets the selection to null; only navigate
        // for a real catalog slug.
        if (
          typeof slug === "string" &&
          forms.some((form) => form.slug === slug)
        ) {
          window.location.assign(`/forms/${slug}`)
        }
      }}
    >
      <div className={cn("flex flex-col gap-2", className)}>
        <label
          htmlFor={id}
          className="text-xs tracking-widest text-muted-foreground uppercase"
        >
          Search by name, agency, or keyword
        </label>
        <div className="flex gap-2">
          <Combobox.Input
            id={id}
            placeholder="Try “passport”, “police”, or “birth”…"
            autoComplete="off"
            className={cn(
              "h-11 min-w-0 flex-1 rounded-none border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
              size === "hero" && "h-13 text-base"
            )}
          />
          {searching && (
            <Button
              variant="outline"
              onClick={clear}
              className={size === "hero" ? "h-13 shrink-0" : "h-11 shrink-0"}
            >
              Clear
            </Button>
          )}
        </div>
        {suggestions.length > 0 && !searching && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                onClick={() => suggest(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        )}
      </div>

      <Combobox.Portal>
        <Combobox.Positioner
          className="z-50 w-[var(--anchor-width)] outline-none"
          sideOffset={4}
        >
          <Combobox.Popup className="max-h-96 overflow-y-auto border border-border bg-card shadow-lg outline-none">
            {results.length === 0 ? (
              <div className="flex flex-col gap-2 p-6">
                <p className="text-sm font-medium">
                  No demo form matches “{query}”.
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  This demo covers three pilot forms plus one alternate. Clear
                  the search to start over.
                </p>
                <div>
                  <Button variant="outline" size="sm" onClick={clear}>
                    Clear search
                  </Button>
                </div>
              </div>
            ) : (
              <Combobox.List>
                {results.map((form) => (
                <Combobox.Item
                  key={form.slug}
                  value={form.slug}
                  className="flex cursor-default gap-4 border-b border-border p-4 outline-none last:border-b-0 data-[highlighted]:bg-muted [&[data-highlighted]_.form-name]:text-primary"
                >
                  <span
                    aria-hidden="true"
                    className="font-mono text-sm text-muted-foreground"
                  >
                    {String(
                      forms.findIndex(
                        (candidate) => candidate.slug === form.slug
                      ) + 1
                    ).padStart(2, "0")}
                  </span>
                  <span className="flex flex-1 flex-col gap-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="form-name font-medium">
                        {form.name}
                      </span>
                      {form.alternate && (
                        <span className="shrink-0 text-xs tracking-widest text-muted-foreground uppercase">
                          Alternate
                        </span>
                      )}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {form.agency}
                    </span>
                    <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest text-primary uppercase">
                      Open form
                      <ArrowRight aria-hidden="true" className="size-3.5" />
                    </span>
                  </span>
                </Combobox.Item>
              ))}
              </Combobox.List>
            )}
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>

      <p role="status" aria-live="polite" className="sr-only">
        {searching
          ? results.length === 0
            ? `No demo form matches ${query}.`
            : `${results.length} demo ${results.length === 1 ? "form" : "forms"} shown.`
          : "Type to search the demo forms."}
      </p>
    </Combobox.Root>
  )
}
