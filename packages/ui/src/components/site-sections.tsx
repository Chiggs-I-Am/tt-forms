import { Card, CardDescription } from "@workspace/ui/components/card"
import { Separator } from "@workspace/ui/components/separator"
import { cn } from "cn"

const steps = [
  {
    title: "Find your form",
    body: "Search the pilot catalog by name, agency, or keyword.",
  },
  {
    title: "Open it and fill it in",
    body: "Every section renders from the published version. Answers stay in this browser until you sign in.",
  },
  {
    title: "Sign in to save",
    body: "Google or an email code lands on one account. The first server save needs sign-in.",
  },
]

export function HowItWorks({
  layout = "rows",
}: {
  layout?: "rows" | "columns"
}) {
  return (
    <section aria-labelledby="how" className="flex flex-col gap-4">
      <h2 id="how" className="font-heading text-lg font-medium">
        How the demo works
      </h2>
      <ol
        className={cn(
          "gap-4",
          layout === "rows" ? "flex flex-col" : "grid sm:grid-cols-3"
        )}
      >
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-4">
            <span
              aria-hidden="true"
              className="font-mono text-sm text-muted-foreground"
            >
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">{step.title}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

export interface OfficialSource {
  agency: string
  label: string
  url: string
}

export function OfficialSources({ sources }: { sources: OfficialSource[] }) {
  return (
    <section aria-labelledby="sources" className="flex flex-col gap-4">
      <h2 id="sources" className="font-heading text-lg font-medium">
        Official sources
      </h2>
      <Card>
        <ul className="flex flex-col">
          {sources.map((source, index) => (
            <li key={source.url}>
              {index > 0 && <Separator />}
              <div className="flex flex-col gap-0.5 py-3 first:pt-0 last:pb-0">
                <p className="text-sm text-muted-foreground">{source.agency}</p>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-primary underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
                >
                  {source.label}
                </a>
              </div>
            </li>
          ))}
        </ul>
      </Card>
      <CardDescription>
        Every demo question is modeled on one of these official pages. Nothing
        typed here reaches any government office.
      </CardDescription>
    </section>
  )
}

export function SiteFooter() {
  return (
    <footer className="flex flex-col gap-2 border-t border-border pt-4 pb-2">
      <p className="text-xs leading-relaxed text-muted-foreground">
        Demo, not a government service. Your sign-in email is real and only used
        for authentication. Every form answer must be fake.
      </p>
    </footer>
  )
}
