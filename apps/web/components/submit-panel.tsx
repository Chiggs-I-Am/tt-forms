"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@workspace/database/api";
import type { Id } from "@workspace/database/data-model";
import { Button } from "@workspace/ui/components/button";
import { buttonVariants } from "@workspace/ui/components/button-variants";
import { cn } from "@workspace/ui/lib/utilities";
import type { Answers, VersionDefinition } from "@/lib/form-answers";
import { toServerAnswers } from "@/components/use-server-draft";

type ServerAnswers = ReturnType<typeof toServerAnswers>;

type StorageResponse = {
  storageId: Id<"_storage">;
};

const isStorageResponse = (value: unknown): value is StorageResponse => {
  if (typeof value !== "object" || value === null || !("storageId" in value)) {
    return false;
  }
  return typeof value.storageId === "string";
};

const containsFiles = (value: Answers[string] | undefined): value is File[] =>
  Array.isArray(value) && value.some((item) => item instanceof File);

const uploadFieldIdsFor = (definition: VersionDefinition): Set<string> => {
  const ids = new Set<string>();
  for (const section of definition.sections) {
    for (const field of section.fields) {
      if (field.kind === "upload") {
        ids.add(field.id);
      }
    }
  }
  return ids;
};

// Submit step for the review screen. Anonymous visitors keep the sign-in
// call to action; signed-in applicants upload files first, save once more,
// and then submit, so the server validates the exact answers on screen.
// Uploads use the three-step flow (#38): an upload URL per file, a POST of
// the bytes, then a saving mutation that enforces type and size. Success
// shows only after Convex confirms, then routes to My applications.
export const SubmitPanel = ({
  formId,
  localAnswers,
  definition,
}: {
  readonly formId: Id<"forms"> | null | undefined;
  readonly localAnswers: Answers;
  readonly definition: VersionDefinition;
}) => {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const saveDraft = useMutation(api.drafts.saveDraft);
  const submitDraft = useMutation(api.submissions.submitDraft);
  const generateUploadUrl = useMutation(api.uploads.generateUploadUrl);
  const saveFile = useMutation(api.uploads.saveFile);
  const serverDraft = useQuery(
    api.drafts.getDraft,
    isAuthenticated && formId !== null && formId !== undefined
      ? { formId }
      : "skip"
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <output className="text-sm text-muted-foreground">
        Checking sign-in.
      </output>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col gap-2 border border-border bg-card p-4">
        <p className="text-sm leading-relaxed">
          Nothing has been sent anywhere. Sign in to keep these answers for the
          first server save. Your sign-in email is real; every form answer must
          be fake.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/signin" className={cn(buttonVariants())}>
            Sign in to save
          </Link>
        </div>
      </div>
    );
  }

  async function onSubmit() {
    if (!formId) {
      setError("The demo backend is unreachable. Try again later.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const uploadOne = async (
      draftId: Id<"drafts">,
      fieldId: string,
      file: File
    ): Promise<string> => {
      const { uploadUrl } = await generateUploadUrl({ draftId });
      const posted = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });
      if (!posted.ok) {
        throw new Error(
          `Upload of ${file.name} failed. Check the connection and try again.`
        );
      }
      const response: unknown = await posted.json();
      if (!isStorageResponse(response)) {
        throw new Error("The upload service returned an invalid response.");
      }
      await saveFile({
        draftId,
        fieldId,
        storageId: response.storageId,
        fileName: file.name,
      });
      return response.storageId;
    };

    let draftId = serverDraft?._id;
    let baseUpdatedAt = serverDraft?.updatedAt;
    try {
      if (!draftId) {
        draftId = await saveDraft({
          answers: toServerAnswers(localAnswers),
          formId,
        });
        baseUpdatedAt = undefined;
      }
      const activeDraftId = draftId;
      const uploadFieldIds = uploadFieldIdsFor(definition);
      const finalAnswers: ServerAnswers = toServerAnswers(localAnswers);
      const uploadResults = await Promise.all(
        [...uploadFieldIds].map(async (fieldId) => {
          const files = localAnswers[fieldId];
          if (!containsFiles(files)) {
            return null;
          }
          const stored = await Promise.all(
            files.map((file) => uploadOne(activeDraftId, fieldId, file))
          );
          return { fieldId, stored };
        })
      );
      for (const result of uploadResults) {
        if (result !== null) {
          finalAnswers[result.fieldId] = result.stored;
        }
      }
      await saveDraft({
        answers: finalAnswers,
        baseUpdatedAt,
        formId,
      });
      await submitDraft({ formId });
      router.push("/applications");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Submission failed."
      );
    }
    setSubmitting(false);
  }

  return (
    <div className="flex flex-col gap-2 border border-border bg-card p-4">
      <p className="text-sm leading-relaxed">
        Use fake answers only. Your sign-in email stays with your account and
        never enters the application.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={submitting}
          onClick={() => void onSubmit()}
        >
          {submitting ? "Submitting." : "Submit application"}
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
};
