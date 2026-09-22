"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "convex/react"
import { api } from "@workspace/database/api"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { errorText } from "./builder-types"

// Starts a new working copy: slug plus name, saved through the same
// developer-admin-only mutation as every other builder write.
export function NewForm() {
  const router = useRouter()
  const save = useMutation(api.forms.saveWorkingCopy)
  const [slug, setSlug] = useState("")
  const [name, setName] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const clean = slug.trim().toLowerCase().replace(/\s+/g, "-")
      await save({
        slug: clean,
        name: name.trim() || clean,
        agency: "",
        sourceLabel: "",
        sourceUrl: "",
        definition: { sections: [] },
      })
      router.push(`/admin/forms/${clean}`)
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={(e) => void create(e)}
      className="flex flex-col gap-3 border border-dashed border-border p-4"
    >
      <h2 className="text-sm font-medium">Start a new working copy</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-slug">Slug</Label>
          <Input
            id="new-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="name-of-form"
            autoComplete="off"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-name">Form name</Label>
          <Input
            id="new-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name of form"
            autoComplete="off"
          />
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div>
        <Button type="submit" variant="outline" size="sm" disabled={busy}>
          {busy ? "Creating…" : "Create working copy"}
        </Button>
      </div>
    </form>
  )
}
