"use client";

import { useId } from "react";
import { FormFiller } from "@/components/form-filler";
import type { SectionDef } from "@/lib/form-answers";

// Applicant-style preview with disposable answers. The storage key is unique
// per mount and never reused, so nothing typed here survives leaving the
// page or reaches the server.
export const DisposablePreview = ({
  slug,
  sections,
}: {
  readonly slug: string;
  readonly sections: SectionDef[];
}) => {
  const storageKey = `preview-${slug}-${useId()}`;

  if (sections.length === 0) {
    return (
      <output className="text-sm text-muted-foreground">
        Add a section above to see the applicant preview.
      </output>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p
        role="note"
        className="border border-dashed border-border p-3 text-sm text-muted-foreground"
      >
        Preview, answers are disposable. Nothing here is saved or submitted.
      </p>
      <FormFiller storageKey={storageKey} definition={{ sections }} />
    </div>
  );
};
