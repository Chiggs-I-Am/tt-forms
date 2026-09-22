import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { PracticeField } from "@/components/practice-field"
import { getForm, pilotForms } from "@/lib/forms"

export function generateStaticParams() {
  return pilotForms.map((form) => ({ slug: form.slug }))
}

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

// Per-form intro page for #34. Cites the official source, previews the
// sections the online version will ask, and states the fake-data rules up
// front. The live fill-and-submit flow arrives in #36; until then the only
// thing to type into is the local practice field.
export default async function FormIntroPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const form = getForm((await params).slug)
  if (!form) {
    notFound()
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-xl flex-col gap-8 p-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-4">
          <p className="text-xs tracking-widest text-muted-foreground uppercase">
            Demo · not a government service
          </p>
          <Link
            href="/signin"
            className="shrink-0 text-sm font-medium underline underline-offset-4"
          >
            Sign in to save
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">{form.agency}</p>
        <h1 className="text-2xl font-medium">{form.name}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {form.summary}
        </p>
        <p className="text-sm">
          Official source:{" "}
          <a
            href={form.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary underline underline-offset-4"
          >
            {form.sourceLabel}
          </a>
        </p>
      </header>

      <section aria-labelledby="sections" className="flex flex-col gap-3">
        <h2 id="sections" className="text-lg font-medium">
          What the online version asks
        </h2>
        <ol className="flex flex-col gap-2">
          {form.sections.map((section, index) => (
            <li key={section} className="flex gap-3 text-sm">
              <span
                aria-hidden="true"
                className="font-mono text-muted-foreground"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>{section}</span>
            </li>
          ))}
        </ol>
      </section>

      <section
        aria-labelledby="practice"
        className="flex flex-col gap-3 border border-border bg-card p-4"
      >
        <h2 id="practice" className="text-lg font-medium">
          Fill the full form, no account needed
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Every question from the official form, one section at a time. Invent
          every answer. Never type a real ID number, address, or personal
          detail. Answers stay in this browser; signing in later keeps them for
          your first save.
        </p>
        <Link
          href={`/forms/${form.slug}/apply`}
          className="text-sm font-medium text-primary underline underline-offset-4"
        >
          Start the full form
        </Link>
        <PracticeField
          storageKey={`form-${form.slug}`}
          label={form.practiceLabel}
          placeholder={form.practicePlaceholder}
        />
        <Link
          href="/signin"
          className="text-sm font-medium underline underline-offset-4"
        >
          Sign in so this can save to the server
        </Link>
      </section>

      <Link
        href="/"
        className="text-sm text-muted-foreground underline underline-offset-4"
      >
        Back to all forms
      </Link>
    </div>
  )
}
