import type { Metadata } from "next"
import Link from "next/link"
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server"
import { api } from "@workspace/database/api"
import { fetchQuery } from "convex/nextjs"
import { ConvexError } from "convex/values"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { FormEditor } from "@/components/admin/form-editor"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  return { title: `Build ${slug} · TT Forms Demo` }
}

// Builder editor. The working copy arrives from the developer-admin-only
// list query, so no second query was added server-side. Mutations run from
// the client editor; the server denies anything a demo-admin attempts.
async function loadCopy(slug: string) {
  try {
    const copies = await fetchQuery(
      api.forms.listWorkingCopies,
      {},
      { token: await convexAuthNextjsToken() }
    )
    return { copy: copies.find((c) => c.slug === slug) ?? null }
  } catch (error) {
    const text =
      error instanceof ConvexError
        ? String(error.data ?? error.message)
        : "The working copy could not be loaded."
    return { denied: text }
  }
}

export default async function AdminFormEditorPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const result = await loadCopy(slug)

  if ("denied" in result) {
    return (
      <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-4 p-6">
        <h1 className="text-2xl font-medium">Form builder</h1>
        <Card>
          <CardHeader>
            <CardTitle>Developer-admin only</CardTitle>
            <CardDescription>{result.denied}</CardDescription>
          </CardHeader>
        </Card>
        <p className="text-sm text-muted-foreground">
          <Link href="/signin" className="underline underline-offset-4">
            Sign in
          </Link>{" "}
          with a developer-admin account, or{" "}
          <Link href="/admin/forms" className="underline underline-offset-4">
            back to the list
          </Link>
          .
        </p>
      </div>
    )
  }

  if (!result.copy) {
    return (
      <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-4 p-6">
        <h1 className="text-2xl font-medium">Form builder</h1>
        <Card>
          <CardHeader>
            <CardTitle>No working copy for “{slug}”</CardTitle>
            <CardDescription>
              Start it from the list page. Nothing was published under this
              name.
            </CardDescription>
          </CardHeader>
        </Card>
        <p className="text-sm text-muted-foreground">
          <Link href="/admin/forms" className="underline underline-offset-4">
            Back to the list
          </Link>
        </p>
      </div>
    )
  }

  const { copy } = result

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-3xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">
          <Link href="/admin/forms" className="underline underline-offset-4">
            Builder
          </Link>{" "}
          · {copy.slug}
        </p>
        <h1 className="text-2xl font-medium">{copy.name}</h1>
        <p className="text-sm text-muted-foreground">
          Edits stay in this working copy until you save and publish. Preview
          answers never reach the server.
        </p>
      </header>
      <FormEditor
        slug={copy.slug}
        initial={{
          name: copy.name,
          agency: copy.agency,
          sourceLabel: copy.sourceLabel,
          sourceUrl: copy.sourceUrl,
          sections: copy.definition.sections,
        }}
      />
    </div>
  )
}
