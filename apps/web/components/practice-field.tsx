"use client"

import { useLocalDraft } from "@/lib/local-draft"

// One practice field per form intro page. Anonymous and local-only: browser
// state plus a localStorage backup, never sent to the server. It survives the
// Google redirect so nothing typed before sign-in is lost; the applicant flow
// (#36) will offer it for the first server save.
export function PracticeField({
  storageKey,
  label,
  placeholder,
}: {
  storageKey: string
  label: string
  placeholder: string
}) {
  const { value, update, restored } = useLocalDraft(storageKey)

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={`practice-${storageKey}`} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={`practice-${storageKey}`}
        type="text"
        value={value}
        onChange={(event) => update(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="h-11 rounded-none border border-input bg-background px-3 text-sm"
      />
      <p className="text-xs leading-relaxed text-muted-foreground">
        {restored && value
          ? "Restored from this browser. Still only here, nowhere else."
          : "Practice only. Stays in this browser; nothing reaches the server until you sign in."}
      </p>
    </div>
  )
}
