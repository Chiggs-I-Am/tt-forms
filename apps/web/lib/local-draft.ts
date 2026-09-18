"use client"

import { useCallback, useEffect, useState } from "react"

// Pre-sign-in answers for #34: browser state first, localStorage as backup.
// Nothing here touches Convex; the first server save requires sign-in
// (sign-in-to-save). Persist before the Google OAuth redirect and restore
// after the callback so no local answer is lost. OTP has no redirect, the
// same backup still applies.
const PREFIX = "tt-forms:local-draft:"

function readBackup(key: string): string {
  try {
    return window.localStorage.getItem(PREFIX + key) ?? ""
  } catch {
    return ""
  }
}

function writeBackup(key: string, value: string) {
  try {
    window.localStorage.setItem(PREFIX + key, value)
  } catch {
    // Private mode or full storage: browser state still holds the answer.
  }
}

export function clearLocalDraft(key: string) {
  try {
    window.localStorage.removeItem(PREFIX + key)
  } catch {
    // Nothing to clear or storage unavailable.
  }
}

export function useLocalDraft(key: string, initial = "") {
  const [value, setValue] = useState(initial)
  const [restored, setRestored] = useState(false)

  // Client-only restore: reading localStorage during render would split
  // server and client HTML, so the backup lands here on mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(readBackup(key) || initial)
    setRestored(true)
    // Restore once per key; later keystrokes are the source of truth.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const update = useCallback(
    (next: string) => {
      setValue(next)
      writeBackup(key, next)
    },
    [key]
  )

  return { value, update, restored }
}
