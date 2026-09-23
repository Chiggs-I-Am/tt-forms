import Link from "next/link"
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server"
import { api } from "@workspace/database/api"
import { fetchQuery } from "convex/nextjs"
import type { Id } from "@workspace/database/data-model"
import { FileLink } from "@/components/file-link"
import { PrintButton } from "@/components/print-button"
import {
  displayTitle,
  splitSection,
  type Answers,
  type Scalar,
  type SectionDef,
  type VersionDefinition,
} from "@/lib/form-answers"
import "./print.css"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<{ title: string }> {
  return { title: `Application ${(await params).id} · TT Forms Demo` }
}

function formatValue(value: Scalar | undefined): string {
  if (value === undefined || value === null) {
    return "—"
  }
  if (Array.isArray(value)) {
    return value.length === 0 ? "—" : value.join(", ")
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No"
  }
  return String(value)
}

function topValue(answers: Answers, fieldId: string): Scalar | undefined {
  const value = answers[fieldId]
  if (value === undefined || typeof value === "object") {
    return Array.isArray(value) &&
      value.every((item) => typeof item === "string")
      ? (value as Scalar)
      : undefined
  }
  return value
}

// Read-only rendering of one stored field. Upload answers resolve through
// the Attached files list below, never through an invented URL.
function FieldLine({
  label,
  value,
}: {
  label: string
  value: Scalar | undefined
}) {
  return (
    <p className="text-sm">
      <span className="text-muted-foreground">{label}: </span>
      {formatValue(value)}
    </p>
  )
}

function SnapshotSection({
  section,
  answers,
}: {
  section: SectionDef
  answers: Answers
}) {
  if (!section.repeat) {
    const stored = section.fields.filter(
      (field) =>
        field.kind !== "upload" && topValue(answers, field.id) !== undefined
    )
    if (stored.length === 0) {
      return null
    }
    return (
      <section
        aria-label={displayTitle(section.title)}
        className="flex flex-col gap-2"
      >
        <h2 className="text-sm font-medium">{displayTitle(section.title)}</h2>
        {stored.map((field) => (
          <FieldLine
            key={field.id}
            label={field.label}
            value={topValue(answers, field.id)}
          />
        ))}
      </section>
    )
  }
  const { once, rows: rowFields } = splitSection(section)
  const raw = answers[section.id]
  const storedRows: Record<string, Scalar>[] =
    Array.isArray(raw) && raw.every((row) => typeof row === "object")
      ? (raw as Record<string, Scalar>[])
      : []
  const storedOnce = once.filter(
    (field) =>
      field.kind !== "upload" && topValue(answers, field.id) !== undefined
  )
  if (storedOnce.length === 0 && storedRows.length === 0) {
    return null
  }
  return (
    <section
      aria-label={displayTitle(section.title)}
      className="flex flex-col gap-2"
    >
      <h2 className="text-sm font-medium">{displayTitle(section.title)}</h2>
      {storedOnce.map((field) => (
        <FieldLine
          key={field.id}
          label={field.label}
          value={topValue(answers, field.id)}
        />
      ))}
      {storedRows.map((row, index) => (
        <div
          key={index}
          className="flex flex-col gap-1 border-l-2 border-border pl-3"
        >
          <p className="font-mono text-xs text-muted-foreground">Entry</p>
          {rowFields
            .filter(
              (field) => field.kind !== "upload" && row[field.id] !== undefined
            )
            .map((field) => (
              <FieldLine
                key={field.id}
                label={field.label}
                value={row[field.id] as Scalar}
              />
            ))}
        </div>
      ))}
    </section>
  )
}

// Printable route for one submitted application. Renders the denormalized
// snapshot (answers, pinned version, file refs, rendered labels) with print
// CSS; print-to-PDF is the only export.
export default async function ApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const token = await convexAuthNextjsToken()
  if (!token) {
    return (
      <div className="mx-auto flex min-h-svh w-full max-w-xl flex-col gap-4 p-6">
        <h1 className="text-2xl font-medium">Submitted application</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Sign in to see the applications you submitted.
        </p>
        <Link
          href="/signin"
          className="text-sm font-medium underline underline-offset-4"
        >
          Sign in
        </Link>
      </div>
    )
  }

  let submission
  try {
    submission = await fetchQuery(
      api.submissions.getSubmission,
      { submissionId: id as Id<"submissions"> },
      { token }
    )
  } catch (error) {
    return (
      <div className="mx-auto flex min-h-svh w-full max-w-xl flex-col gap-4 p-6">
        <h1 className="text-2xl font-medium">Submitted application</h1>
        <p role="alert" className="text-sm text-destructive">
          {error instanceof Error
            ? error.message
            : "This application could not be loaded."}
        </p>
        <Link
          href="/applications"
          className="text-sm font-medium underline underline-offset-4"
        >
          Back to My applications
        </Link>
      </div>
    )
  }

  const definition = submission.definition as VersionDefinition
  const answers = submission.answers as Answers

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">{submission.formName}</p>
        <h1 className="text-2xl font-medium">Submitted application</h1>
        <p className="text-sm">
          Official source:{" "}
          <a
            href={submission.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary underline underline-offset-4"
          >
            {submission.sourceLabel}
          </a>
        </p>
        <p className="text-sm text-muted-foreground">
          Version {submission.version} · Submitted{" "}
          {new Date(submission.submittedAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </p>
      </header>

      {definition.sections.map((section) => (
        <SnapshotSection key={section.id} section={section} answers={answers} />
      ))}

      {submission.files.length > 0 && (
        <section aria-label="Attached files" className="flex flex-col gap-2">
          <h2 className="text-sm font-medium">Attached files</h2>
          <ul className="flex flex-col gap-1">
            {submission.files.map((file) => (
              <li key={file.fileId}>
                <FileLink fileId={file.fileId} fileName={file.fileName} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="no-print flex flex-wrap gap-2 border-t border-border pt-4">
        <PrintButton />
        <Link
          href="/applications"
          className="text-sm font-medium underline underline-offset-4"
        >
          Back to My applications
        </Link>
      </footer>
    </main>
  )
}
