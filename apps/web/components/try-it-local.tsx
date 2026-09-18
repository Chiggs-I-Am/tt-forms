"use client"

import { useLocalDraft } from "@/lib/local-draft"

// Anonymous try-before-sign-in for #34. This answer lives in component state
// with a localStorage backup and never reaches the server. Signing in later
// (including through the Google redirect) keeps it intact in this browser;
// the applicant flow (#36) will offer it for the first server save.
export function TryItLocal() {
  const { value, update, restored } = useLocalDraft("home-try-it")

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="try-it" className="text-sm font-medium">
        Try a field without signing in
      </label>
      <textarea
        id="try-it"
        rows={3}
        value={value}
        onChange={(event) => update(event.target.value)}
        placeholder="Invent something, e.g. Anya Bhim, 36 Ariapita Avenue"
        className="rounded-none border border-input bg-background px-3 py-2 text-sm"
      />
      <p className="text-xs leading-relaxed text-muted-foreground">
        {restored && value
          ? "Restored from this browser. Still only here, nowhere else."
          : "Stays in this browser only. Nothing is saved to the server until you sign in."}
      </p>
    </div>
  )
}
