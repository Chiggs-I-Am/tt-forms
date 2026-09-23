"use client"

import { useQuery } from "convex/react"
import { api } from "@workspace/database/api"
import type { Id } from "@workspace/database/data-model"

// Gated file link for the printable view. The URL comes only from the
// existing fileUrl query, which checks ownership or developer-admin role,
// so no URL is ever invented here.
export function FileLink({
  fileId,
  fileName,
}: {
  fileId: Id<"files">
  fileName: string
}) {
  const file = useQuery(api.uploads.fileUrl, { fileId })

  if (!file) {
    return <span className="text-sm text-muted-foreground">{fileName}</span>
  }
  return (
    <a
      href={file.url}
      target="_blank"
      rel="noreferrer"
      className="text-sm font-medium text-primary underline underline-offset-4"
    >
      {fileName}
    </a>
  )
}
