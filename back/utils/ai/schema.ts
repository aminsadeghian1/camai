import type { AiReviewOutput } from "./types.ts";
import { throwError } from "../throwError.ts";

const stringArray = (value: unknown, field: string): string[] => {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throwError(`VALIDATION_FAILED: AI output ${field} must be a string array`);
  }
  return value as string[];
};

export const validateAiOutput = (raw: unknown): AiReviewOutput => {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throwError("AI_UNAVAILABLE: AI provider returned a non-object result");
  }

  const value = raw as Record<string, unknown>;
  const summary = value.summary;

  if (typeof summary !== "string" || !summary.trim()) {
    return throwError("VALIDATION_FAILED: AI output is missing summary");
  }

  const confidence = typeof value.confidence === "number"
    ? value.confidence
    : Number(value.confidence);

  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    throwError("VALIDATION_FAILED: AI output confidence must be 0..1");
  }

  if (
    !value.nextExercise || typeof value.nextExercise !== "object" ||
    Array.isArray(value.nextExercise)
  ) {
    throwError("VALIDATION_FAILED: AI output is missing nextExercise");
  }

  return {
    summary,
    strengths: stringArray(value.strengths ?? [], "strengths"),
    issues: stringArray(value.issues ?? [], "issues"),
    evidence: stringArray(value.evidence ?? [], "evidence"),
    actions: stringArray(value.actions ?? [], "actions"),
    nextExercise: value.nextExercise as Record<string, unknown>,
    confidence,
    modelVersion: typeof value.modelVersion === "string"
      ? value.modelVersion
      : "unknown",
    promptVersion: typeof value.promptVersion === "string"
      ? value.promptVersion
      : "unknown",
  };
};
