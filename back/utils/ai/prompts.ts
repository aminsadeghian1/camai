import type { AiReviewInput } from "./types.ts";

export const PROMPT_VERSION = "camai-photo-review-v1";

export const buildPrompt = (input: AiReviewInput): string =>
  [
    "You are CAMAI's photography teacher.",
    "Return only JSON matching the required schema.",
    "Use only visible evidence and supplied metadata. Never invent EXIF or exact camera settings.",
    "Separate visible evidence from interpretation. State uncertainty when the image cannot support a conclusion.",
    "Do not claim artistic truth or professional certification.",
    "Connect the review to the assignment and the learner's current skill.",
    "",
    "Assignment:",
    JSON.stringify(input.assignment),
    "Lesson objective:",
    input.lessonObjective ?? "not supplied",
    "Learner level:",
    input.learnerLevel ?? "unknown",
    "Skill state:",
    JSON.stringify(input.skillState ?? {}),
    "EXIF:",
    JSON.stringify(input.exif ?? {}),
    "Deterministic technical analysis:",
    JSON.stringify(input.technicalAnalysis ?? {}),
    "Lab evidence:",
    JSON.stringify(input.labEvidence ?? {}),
    "Image reference:",
    input.imageReference ?? "not supplied",
  ].join("\n");
