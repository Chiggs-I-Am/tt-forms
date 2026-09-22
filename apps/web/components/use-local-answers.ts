"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  deserialize,
  ensureRows,
  serialize,
  type Answers,
  type Scalar,
  type SectionDef,
  type StoredRow,
  type VersionDefinition,
} from "@/lib/form-answers"

const PREFIX = "tt-forms:apply:"

function readBackup(key: string): Answers {
  try {
    return deserialize(window.localStorage.getItem(PREFIX + key))
  } catch {
    return {}
  }
}

// Local-only answers for the fill view (#36 precursor). Browser state first,
// localStorage backup second; nothing reaches Convex. Repeated sections are
// padded to their minimum row count on restore so required repeats (e.g. the
// two passport references) always render.
export function useLocalAnswers(key: string, definition: VersionDefinition) {
  const [answers, setAnswers] = useState<Answers>({})
  // Render the form immediately with empty answers; the backup merges in on
  // mount. Gating on restore would flash a loading state on every visit.
  const restoredRef = useRef(false)

  useEffect(() => {
    const restored = readBackup(key)
    for (const section of definition.sections) {
      if (section.repeat) {
        restored[section.id] = ensureRows(restored, section)
      }
    }
    // Client-only restore: reading localStorage during render would split
    // server and client HTML.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAnswers(restored)
    restoredRef.current = true
    // Restore once; later keystrokes are the source of truth.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  useEffect(() => {
    if (!restoredRef.current) {
      return
    }
    try {
      window.localStorage.setItem(PREFIX + key, serialize(answers))
    } catch {
      // Private mode or full storage: browser state still holds the answers.
    }
  }, [answers, key])

  const setScalar = useCallback(
    (fieldId: string, value: Scalar | undefined) => {
      setAnswers((prev) => {
        if (value === undefined) {
          const next = { ...prev }
          delete next[fieldId]
          return next
        }
        return { ...prev, [fieldId]: value }
      })
    },
    []
  )

  const setCell = useCallback(
    (
      section: SectionDef,
      index: number,
      fieldId: string,
      value: Scalar | undefined
    ) => {
      setAnswers((prev) => {
        const rows = ensureRows(prev, section).map((row) => ({ ...row }))
        while (rows.length <= index) {
          rows.push({})
        }
        const row: StoredRow = { ...(rows[index] ?? {}) }
        if (value === undefined) {
          delete row[fieldId]
        } else {
          row[fieldId] = value
        }
        rows[index] = row
        return { ...prev, [section.id]: rows }
      })
    },
    []
  )

  const addRow = useCallback((section: SectionDef) => {
    if (!section.repeat) {
      return
    }
    setAnswers((prev) => {
      const rows = ensureRows(prev, section).map((row) => ({ ...row }))
      if (rows.length >= section.repeat!.max) {
        return prev
      }
      return { ...prev, [section.id]: [...rows, {}] }
    })
  }, [])

  const removeRow = useCallback((section: SectionDef, index: number) => {
    if (!section.repeat) {
      return
    }
    setAnswers((prev) => {
      const rows = ensureRows(prev, section).map((row) => ({ ...row }))
      if (rows.length <= section.repeat!.min) {
        return prev
      }
      return {
        ...prev,
        [section.id]: rows.filter((_, i) => i !== index),
      }
    })
  }, [])

  return { answers, setScalar, setCell, addRow, removeRow }
}
