"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@workspace/database/api";
import type { Doc, Id } from "@workspace/database/data-model";
import type { Answers } from "@/lib/form-answers";

export type DraftStatus =
  | "local-only"
  | "loading"
  | "synced"
  | "saving"
  | "not-saved"
  | "conflict"
  | "version-pick";

type ServerScalar = string | number | boolean | string[];
type ServerRow = Record<string, ServerScalar>;
type ServerAnswers = Record<string, ServerScalar | ServerRow[]>;
type DraftDocument = Doc<"drafts">;

export type ServerDraftView = Pick<
  DraftDocument,
  | "_id"
  | "formId"
  | "formVersionId"
  | "answers"
  | "status"
  | "expiresAt"
  | "updatedAt"
> & {
  version: {
    versionId: Id<"formVersions">;
    version: number;
    status: string;
    withdrawReason?: string;
  } | null;
};

const isRecord = function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const isStringArray = (value: unknown[]): value is string[] =>
  value.every((item) => typeof item === "string");

const isServerScalar = (value: unknown): value is ServerScalar => {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return true;
  }
  return Array.isArray(value) && isStringArray(value);
};

const isServerRow = function isServerRow(value: unknown): value is ServerRow {
  return (
    isRecord(value) &&
    !(value instanceof File) &&
    Object.values(value).every(isServerScalar)
  );
};

// File objects live in memory only, so strip them before any server save.
// Upload answers travel as storage-id strings (#38); locally they are File
// arrays, which the answers validator would reject.
export const toServerAnswers = (local: Answers): ServerAnswers => {
  const clean: ServerAnswers = {};
  for (const [key, value] of Object.entries(local)) {
    if (!(value instanceof File)) {
      if (Array.isArray(value)) {
        if (value.length > 0 && value[0] instanceof File) {
          clean[key] = [];
        } else if (isServerScalar(value) || value.every(isServerRow)) {
          clean[key] = value;
        }
      } else if (isServerScalar(value)) {
        clean[key] = value;
      }
    }
  }
  return clean;
};

const compareKeys = (left: string, right: string): number =>
  JSON.stringify(left).localeCompare(JSON.stringify(right));

// Canonical comparison: the server may store answers with a different key
// order than the local form state, so key order must never count as a
// difference. Mirrors stableStringify in packages/database/convex/seed.ts.
const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (isRecord(value)) {
    const sortedKeys = Object.keys(value).toSorted(compareKeys);
    const entries = sortedKeys.map((key) => {
      const entryValue = value[key];
      return `${JSON.stringify(key)}:${stableStringify(entryValue)}`;
    });
    return `{${entries.join(",")}}`;
  }
  const serialized: unknown = JSON.stringify(value);
  return typeof serialized === "string" ? serialized : "null";
};

const stableJson = (value: unknown): string => stableStringify(value ?? null);

const isNullish = (value: unknown): value is null | undefined =>
  value === null || value === undefined;

const isEmptyCell = (cell: unknown): boolean => {
  if (cell === "" || isNullish(cell)) {
    return true;
  }
  return Array.isArray(cell) && cell.length === 0;
};

const isEmptyRow = (item: unknown): boolean => {
  if (!isRecord(item) || item instanceof File) {
    return false;
  }
  return Object.values(item).every(isEmptyCell);
};

const hasMeaningfulRow = (value: unknown[]): boolean =>
  value.length > 0 && !value.every(isEmptyRow);

const isMeaningfulValue = (value: unknown): boolean => {
  if (value === "" || isNullish(value)) {
    return false;
  }
  if (Array.isArray(value)) {
    return hasMeaningfulRow(value);
  }
  return typeof value !== "object";
};

const hasMeaningfulContent = (answers: ServerAnswers): boolean =>
  Object.values(answers).some(isMeaningfulValue);

export const diffKeys = (
  localAnswers: ServerAnswers,
  serverAnswers: ServerAnswers
): string[] => {
  const keys = new Set(Object.keys(localAnswers));
  for (const key of Object.keys(serverAnswers)) {
    keys.add(key);
  }
  const differingKeys: string[] = [];
  for (const key of keys) {
    if (stableJson(localAnswers[key]) !== stableJson(serverAnswers[key])) {
      differingKeys.push(key);
    }
  }
  return differingKeys;
};

const isPresent = <T>(value: T | null | undefined): value is T =>
  value !== null && value !== undefined;

const resolveBaseUpdatedAt = (
  requestedBase: number | undefined,
  draft: ServerDraftView | null | undefined,
  currentBase: number | null
): number | undefined => {
  if (requestedBase !== undefined) {
    return requestedBase;
  }
  if (!isPresent(draft)) {
    return undefined;
  }
  return currentBase ?? undefined;
};

interface AutosaveCheck {
  draft: ServerDraftView | null | undefined;
  draftFormId: Id<"forms"> | null | undefined;
  isAuthenticated: boolean;
  isDifferent: boolean;
  isInConflict: boolean;
  isVersionMismatch: boolean;
}

const canAutosave = ({
  draft,
  draftFormId,
  isAuthenticated,
  isDifferent,
  isInConflict,
  isVersionMismatch,
}: AutosaveCheck): boolean => {
  if (!isAuthenticated) {
    return false;
  }
  if (!isPresent(draftFormId)) {
    return false;
  }
  if (draft === undefined) {
    return false;
  }
  if (isVersionMismatch || isInConflict) {
    return false;
  }
  return isDifferent;
};

export const useServerDraft = function useServerDraft({
  formId,
  versionId,
  localAnswers,
}: {
  formId: Id<"forms"> | null | undefined;
  versionId: Id<"formVersions"> | null | undefined;
  localAnswers: Answers;
}) {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const serverDraft = useQuery(
    api.drafts.getDraft,
    isAuthenticated && formId !== null && formId !== undefined
      ? { formId }
      : "skip"
  );
  const saveDraft = useMutation(api.drafts.saveDraft);
  const replaceDraft = useMutation(api.drafts.replaceDraft);

  const [saveBase, setSaveBase] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [picks, setPicks] = useState<Record<string, "mine" | "server">>({});
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const justSavedReference = useRef(false);
  const [initialResolved, setInitialResolved] = useState(false);
  const serverArrivedReference = useRef(false);

  const sanitized = useMemo(
    () => toServerAnswers(localAnswers),
    [localAnswers]
  );

  useEffect(() => {
    if (
      serverDraft !== null &&
      serverDraft !== undefined &&
      justSavedReference.current
    ) {
      justSavedReference.current = false;
      setSaveBase(serverDraft.updatedAt);
      return;
    }
    if (
      serverDraft !== null &&
      serverDraft !== undefined &&
      saveBase === null
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSaveBase(serverDraft.updatedAt);
    }
  }, [serverDraft, saveBase]);

  const isVersionMismatch = useMemo(() => {
    if (
      serverDraft === null ||
      serverDraft === undefined ||
      versionId === null ||
      versionId === undefined
    ) {
      return false;
    }
    return serverDraft.formVersionId !== versionId;
  }, [serverDraft, versionId]);

  const serverAnswers = useMemo(
    () => serverDraft?.answers ?? {},
    [serverDraft]
  );

  const isDifferent = useMemo(() => {
    if (serverDraft === null || serverDraft === undefined) {
      return stableJson(sanitized) !== stableJson({});
    }
    return stableJson(sanitized) !== stableJson(serverAnswers);
  }, [serverDraft, serverAnswers, sanitized]);

  const isStaleBase = useMemo(() => {
    if (
      serverDraft === null ||
      serverDraft === undefined ||
      saveBase === null
    ) {
      return false;
    }
    return serverDraft.updatedAt !== saveBase;
  }, [serverDraft, saveBase]);

  useEffect(() => {
    if (serverDraft === undefined || serverArrivedReference.current) {
      return;
    }
    if (serverDraft === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInitialResolved(true);
      return;
    }
    serverArrivedReference.current = true;
    const hasServerContent = hasMeaningfulContent(serverDraft.answers);
    if (!hasServerContent) {
      setInitialResolved(true);
      return;
    }
    setInitialResolved(
      stableJson(sanitized) === stableJson(serverDraft.answers)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverDraft]);

  useEffect(() => {
    if (
      serverDraft === null ||
      serverDraft === undefined ||
      initialResolved ||
      !serverArrivedReference.current
    ) {
      return;
    }
    if (stableJson(sanitized) === stableJson(serverAnswers)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInitialResolved(true);
    }
  }, [sanitized, serverAnswers, serverDraft, initialResolved]);

  const initialConflict = useMemo(() => {
    if (
      initialResolved ||
      serverDraft === null ||
      serverDraft === undefined ||
      isVersionMismatch
    ) {
      return [];
    }
    if (!hasMeaningfulContent(serverAnswers)) {
      return [];
    }
    return diffKeys(sanitized, serverAnswers);
  }, [
    initialResolved,
    serverDraft,
    isVersionMismatch,
    serverAnswers,
    sanitized,
  ]);

  const conflictFields = useMemo(() => {
    if (
      serverDraft === null ||
      serverDraft === undefined ||
      isVersionMismatch
    ) {
      return [];
    }
    if (isStaleBase) {
      return diffKeys(sanitized, serverAnswers);
    }
    return initialConflict;
  }, [
    serverDraft,
    isVersionMismatch,
    isStaleBase,
    serverAnswers,
    sanitized,
    initialConflict,
  ]);

  const isInConflict = conflictFields.length > 0;

  const handlePersistError = (error: unknown): void => {
    const message = Error.isError(error) ? error.message : "Autosave failed.";
    if (!message.includes("Draft changed elsewhere")) {
      setSaveError(message);
    }
  };

  const persist = async (options?: { base?: number; retry?: boolean }) => {
    if (formId === null || formId === undefined) {
      return;
    }
    setSaving(true);
    if (options?.retry !== true) {
      setSaveError(null);
    }
    const baseUpdatedAt = resolveBaseUpdatedAt(
      options?.base,
      serverDraft,
      saveBase
    );
    try {
      await saveDraft({
        answers: sanitized,
        baseUpdatedAt,
        formId,
      });
      justSavedReference.current = true;
      setSaveError(null);
      setInitialResolved(true);
    } catch (error) {
      handlePersistError(error);
    }
    setSaving(false);
  };

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    if (
      canAutosave({
        draft: serverDraft,
        draftFormId: formId,
        isAuthenticated,
        isDifferent,
        isInConflict,
        isVersionMismatch,
      })
    ) {
      const timer = setTimeout(() => {
        void persist();
      }, 2000);
      cleanup = () => {
        clearTimeout(timer);
      };
    }
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    sanitized,
    isAuthenticated,
    formId,
    serverDraft,
    isVersionMismatch,
    isInConflict,
    isDifferent,
  ]);

  const saveMerged = async () => {
    if (
      serverDraft === null ||
      serverDraft === undefined ||
      formId === null ||
      formId === undefined
    ) {
      return;
    }
    const merged: ServerAnswers = { ...serverAnswers };
    for (const key of conflictFields) {
      const value =
        picks[key] === "server" ? serverAnswers[key] : sanitized[key];
      if (value !== undefined) {
        merged[key] = value;
      }
    }
    setSaving(true);
    try {
      await saveDraft({
        answers: merged,
        baseUpdatedAt: serverDraft.updatedAt,
        formId,
      });
      justSavedReference.current = true;
      setPicks({});
      setSaveError(null);
      setInitialResolved(true);
    } catch (error) {
      setSaveError(
        Error.isError(error) ? error.message : "Merged save failed."
      );
    } finally {
      setSaving(false);
    }
  };

  const pickMine = async () => {
    if (
      serverDraft === null ||
      serverDraft === undefined ||
      formId === null ||
      formId === undefined
    ) {
      return;
    }
    setSaving(true);
    try {
      await replaceDraft({
        answers: sanitized,
        confirm: true,
        formId,
        retireVersionId: serverDraft.formVersionId,
      });
      justSavedReference.current = true;
      setConfirmDiscard(false);
      setSaveError(null);
      setInitialResolved(true);
    } catch (error) {
      setSaveError(
        Error.isError(error) ? error.message : "Version pick failed."
      );
    } finally {
      setSaving(false);
    }
  };

  const adoptServer = (appliedUpdatedAt: number) => {
    setSaveBase(appliedUpdatedAt);
    setPicks({});
    setConfirmDiscard(false);
    setSaveError(null);
    setInitialResolved(true);
  };

  let status: DraftStatus = "synced";
  if (!isAuthenticated) {
    status = authLoading ? "loading" : "local-only";
  } else if (serverDraft === undefined) {
    status = "loading";
  } else if (isVersionMismatch) {
    status = "version-pick";
  } else if (isInConflict) {
    status = "conflict";
  } else if (saveError !== null) {
    status = "not-saved";
  } else if (saving) {
    status = "saving";
  }

  return {
    adoptServer,
    confirmDiscard,
    conflictFields,
    differs: isDifferent,
    persist,
    pickMine,
    picks,
    saveError,
    saveMerged,
    saving,
    serverAnswers,
    serverDraft,
    setConfirmDiscard,
    setPicks,
    status,
  };
};
