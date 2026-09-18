"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { pilotForms } from "@/lib/forms"

function matches(form: (typeof pilotForms)[number], query: string) {
  const haystack = [form.name, form.agency, form.summary, ...form.keywords]
    .join(" ")
    .toLowerCase()
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word))
}

export function FormSearch() {
  const [query, setQuery] = useState("")
  const results = useMemo(
    () => pilotForms.filter((form) => matches(form, query)),
    [query]
  )

  return (
    <section aria-labelledby="find-form" className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 id="find-form" className="text-lg font-medium">
          Find your form
        </h2>
        <label
          htmlFor="form-search"
          className="text-xs tracking-widest text-muted-foreground uppercase"
        >
          Search by name, agency, or keyword
        </label>
        <div className="flex gap-2">
          <input
            id="form-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try “passport”, “police”, or “birth”…"
            autoComplete="off"
            className="h-11 flex-1 rounded-none border border-input bg-background px-3 text-sm"
          />
          {query && (
            <Button variant="outline" onClick={() => setQuery("")}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {results.length === 0 ? (
        <div
          role="status"
          className="flex flex-col gap-2 border border-dashed border-border p-6"
        >
          <p className="text-sm font-medium">No demo form matches “{query}”.</p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            This demo covers three pilot forms plus one alternate. Clear the
            search to see them all.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {results.map((form) => (
            <li key={form.slug}>
              <Link
                href={`/forms/${form.slug}`}
                className="group flex flex-col gap-1 border border-border bg-card p-4 transition-colors hover:border-primary"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-medium group-hover:text-primary">
                    {form.name}
                  </p>
                  {form.alternate && (
                    <p className="shrink-0 text-xs tracking-widest text-muted-foreground uppercase">
                      Alternate
                    </p>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{form.agency}</p>
                <p className="text-sm leading-relaxed">{form.summary}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
