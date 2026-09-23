import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { api } from "@workspace/database/api"
import { fetchQuery } from "convex/nextjs"
import { FormFiller } from "@/components/form-filler"
import { getForm } from "@/lib/forms"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const form = getForm((await params).slug)
  return {
    title: form ? `${form.name} · TT Forms Demo` : "Form · TT Forms Demo",
  }
}

// The form itself is the page. Loads the latest published version from
// Convex and renders every section and field from its definition, one
// section at a time. Answers stay in this browser while anonymous; signed-in
// applicants autosave to one server draft per form (#36) and submit in #37.
// Retired versions stop new applications; withdrawn versions explain why and
// stay closed.
async function loadForm(slug: string) {
  try {
    const [version, published] = await Promise.all([
      fetchQuery(api.forms.getLatestVersion, { slug }),
      fetchQuery(api.forms.listPublished, {}),
    ])
    const entry = published.find((form) => form.slug === slug)
    return { version, formId: entry?.formId ?? null }
  } catch {
    return { version: null, formId: null }
  }
}

export default async function FormPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const intro = getForm(slug)
  if (!intro) {
    notFound()
  }
  const { version, formId } = await loadForm(slug)

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-xl flex-col gap-8 p-6">
      <header className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">{intro.agency}</p>
        <h1 className="text-2xl font-medium">{intro.name}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Demonstration only. Nothing typed here reaches the government; every
          answer must be fake.
        </p>
        <p className="text-sm">
          Official source:{" "}
          <a
            href={version?.sourceUrl ?? intro.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary underline underline-offset-4"
          >
            {version?.sourceLabel ?? intro.sourceLabel}
          </a>
        </p>
      </header>

      {!version ? (
        <div
          role="status"
          className="flex flex-col gap-2 border border-dashed border-border p-6"
        >
          <p className="text-sm font-medium">
            This form is unavailable right now.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            The live version could not be loaded. The demo backend may be
            unreachable. Your browser kept any answers you already typed.
          </p>
        </div>
      ) : version.status === "withdrawn" ? (
        <div
          role="status"
          className="flex flex-col gap-2 border border-destructive/40 p-6"
        >
          <p className="text-sm font-medium">
            Applications for this version are closed.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {version.withdrawReason ?? "This version was withdrawn."} Answers
            you already typed stay readable in this browser until they expire.
          </p>
        </div>
      ) : version.status === "retired" ? (
        <div
          role="status"
          className="flex flex-col gap-2 border border-dashed border-border p-6"
        >
          <p className="text-sm font-medium">
            This version no longer accepts new applications.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Existing drafts stay submittable under its rules until they expire.
            Check back for the replacement version.
          </p>
        </div>
      ) : (
        <FormFiller
          storageKey={`${slug}-v${version.version}`}
          definition={version.definition}
          formId={formId}
          versionId={version.versionId}
        />
      )}

      <footer className="flex flex-col gap-2 border-t border-border pt-4 pb-2">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Version {version?.version ?? "—"} ·{" "}
          <Link href="/forms" className="underline underline-offset-4">
            Back to all forms
          </Link>
        </p>
      </footer>
    </div>
  )
}
