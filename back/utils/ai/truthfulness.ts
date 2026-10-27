import type { AiReviewInput, AiReviewOutput } from "./types.ts";

const settingPattern = /\b(?:ISO\s*\d+|f\/\d+(?:\.\d+)?|1\/\d+\s*(?:s|sec)?)\b/gi;
const replaceSetting = (text: string): string =>
  text
    .replace(/\bISO\s*\d+\b/gi, "the reported ISO")
    .replace(/\bf\/\d+(?:\.\d+)?\b/gi, "the reported aperture")
    .replace(/\b1\/\d+\s*(?:s|sec)?\b/gi, "the reported shutter speed");

export const sanitizeAiOutput = (
  output: AiReviewOutput,
  input: AiReviewInput,
): AiReviewOutput => {
  const hasExif = Boolean(input.exif && Object.keys(input.exif).length > 0);
  const missingSettings = !hasExif;

  const sanitizeText = (text: string) =>
    missingSettings && settingPattern.test(text) ? replaceSetting(text) : text;

  return {
    ...output,
    summary: sanitizeText(output.summary),
    strengths: output.strengths.map(sanitizeText),
    issues: output.issues.map(sanitizeText),
    evidence: output.evidence.map(sanitizeText),
    actions: output.actions.map(sanitizeText),
    ...(missingSettings
      ? {
        evidence: [
          ...output.evidence,
          "Camera settings were not supplied, so this review relies on visible evidence only.",
        ],
      }
      : {}),
  };
};
