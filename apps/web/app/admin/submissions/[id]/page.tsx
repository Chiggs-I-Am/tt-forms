import Link from "next/link";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "@workspace/database/api";
import { fetchQuery } from "convex/nextjs";
import type { Id } from "@workspace/database/data-model";
import { FileLink } from "@/components/file-link";
import {
  displayTitle,
  splitSection,
  type Answers,
  type Scalar,
  type SectionDef,
  type VersionDefinition,
} from "@/lib/form-answers";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<{ title: string }> {
  return { title: `Submission ${(await params).id} · TT Forms Demo` };
}

const formatValue = (value: Scalar | undefined): string => {
  if (value === undefined || value === null) {
    return "—";
  }
  if (Array.isArray(value)) {
    return value.length === 0 ? "—" : value.join(", ");
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  return String(value);
};

const topValue = (answers: Answers, fieldId: string): Scalar | undefined => {
  const value = answers[fieldId];
  if (Array.isArray(value)) {
    return value.every((item): item is string => typeof item === "string")
      ? value
      : undefined;
  }
  if (value === undefined || typeof value === "object") {
    return undefined;
  }
  return value;
};

const rowKey = (row: Record<string, unknown>, occurrence: number): string => {
  const data = Object.keys(row)
    .sort()
    .map((key) => `${key}:${JSON.stringify(row[key])}`)
    .join("|");
  return `${data}#${occurrence}`;
};

// Read-only snapshot rendering, kept next to the applicant printable view in
// app/applications/[id]/page.tsx. That page owns the pattern; this copy is
// deliberately minimal and admin-side only, since shared-component extraction
// would mean refactoring the applicant route.
const FieldLine = ({
  label,
  value,
}: {
  readonly label: string;
  readonly value: Scalar | undefined;
}) => {
  return (
    <p className="text-sm">
      <span className="text-muted-foreground">{label}: </span>
      {formatValue(value)}
    </p>
  );
};

const SnapshotSection = ({
  section,
  answers,
}: {
  readonly section: SectionDef;
  readonly answers: Answers;
}) => {
  if (!section.repeat) {
    const stored = section.fields.filter(
      (field) =>
        field.kind !== "upload" && topValue(answers, field.id) !== undefined
    );
    if (stored.length === 0) {
      return null;
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
    );
  }
  const { once, rows: rowFields } = splitSection(section);
  const raw = answers[section.id];
  const storedRows: Record<string, Scalar>[] =
    Array.isArray(raw) && raw.every((row) => typeof row === "object")
      ? (raw as Record<string, Scalar>[])
      : [];
  const storedOnce = once.filter(
    (field) =>
      field.kind !== "upload" && topValue(answers, field.id) !== undefined
  );
  if (storedOnce.length === 0 && storedRows.length === 0) {
    return null;
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
          key={rowKey(row, index)}
          className="flex flex-col gap-1 border-l-2 border-border pl-3"
        >
          <p className="font-mono text-xs text-muted-foreground">Entry</p>
          {rowFields.flatMap((field) => {
            if (field.kind === "upload" || row[field.id] === undefined) {
              return [];
            }
            return [
              <FieldLine
                key={field.id}
                label={field.label}
                value={row[field.id]}
              />,
            ];
          })}
        </div>
      ))}
    </section>
  );
};

// Admin submission detail. Reads through the existing getSubmission query, so
// owner-or-developer-admin gating and the pinned version definition come from
// the same path the applicant printable view uses. Read-only: no edit affordance.
const AdminSubmissionPage = async ({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) => {
  const [{ id }, token] = await Promise.all([params, convexAuthNextjsToken()]);
  if (!token) {
    return (
      <div className="mx-auto flex min-h-svh w-full max-w-xl flex-col gap-4 p-6">
        <h1 className="text-2xl font-medium">Submission</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Sign in with a developer-admin account to open submissions.
        </p>
        <Link
          href="/signin"
          className="text-sm font-medium underline underline-offset-4"
        >
          Sign in
        </Link>
      </div>
    );
  }

  let submission;
  try {
    submission = await fetchQuery(
      api.submissions.getSubmission,
      { submissionId: id as Id<"submissions"> },
      { token }
    );
  } catch (error) {
    return (
      <div className="mx-auto flex min-h-svh w-full max-w-xl flex-col gap-4 p-6">
        <h1 className="text-2xl font-medium">Submission</h1>
        <p role="alert" className="text-sm text-destructive">
          {error instanceof Error
            ? error.message
            : "This submission could not be loaded."}
        </p>
        <Link
          href="/admin/submissions"
          className="text-sm font-medium underline underline-offset-4"
        >
          Back to submissions
        </Link>
      </div>
    );
  }

  const definition = submission.definition as VersionDefinition;
  const answers = submission.answers as Answers;

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">{submission.formName}</p>
        <h1 className="text-2xl font-medium">Submission</h1>
        <p className="text-sm text-muted-foreground">
          Every answer below is invented demo data under version{" "}
          {submission.version}. Only the sign-in email is real.
        </p>
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

      <footer className="flex flex-wrap gap-2 border-t border-border pt-4">
        <Link
          href="/admin/submissions"
          className="text-sm font-medium underline underline-offset-4"
        >
          Back to submissions
        </Link>
      </footer>
    </main>
  );
};

export default AdminSubmissionPage;
