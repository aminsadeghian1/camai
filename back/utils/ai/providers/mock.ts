import type { AiProvider, AiProviderResult, AiReviewInput } from "../types.ts";

const numberValue = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

export const mockProvider: AiProvider = {
  name: "mock",
  model: "camai-deterministic-review-v1",

  generate(input: AiReviewInput): Promise<AiProviderResult> {
    const analysis = input.technicalAnalysis ?? {};
    const exif = input.exif ?? {};
    const motionRisk = numberValue(analysis.motionBlurRisk);
    const noise = numberValue(analysis.noise);
    const dof = numberValue(analysis.depthOfFieldTotal);
    const objective = String(input.assignment.objective ?? "the assignment");

    const strengths = [
      "The frame gives enough visual context for a concrete composition discussion.",
    ];
    const issues: string[] = [];
    const actions: string[] = [];

    if (typeof exif.fNumber === "number" || typeof exif.iso === "number") {
      strengths.push(
        "The supplied metadata makes it possible to connect the visual result to camera settings.",
      );
    } else {
      strengths.push(
        "The review stays grounded in visible evidence because no EXIF was supplied.",
      );
    }

    if (motionRisk !== undefined && motionRisk > 0.55) {
      issues.push("Motion blur is likely to reduce crispness in this frame.");
      actions.push(
        "Take a second frame with a faster shutter speed or a steadier support.",
      );
    }

    if (noise !== undefined && noise > 0.65) {
      issues.push(
        "High ISO noise may be competing with fine detail in the image.",
      );
      actions.push(
        "Add light or use a slower scene before raising ISO further.",
      );
    }

    if (dof !== undefined && Number.isFinite(dof) && dof < 0.2) {
      issues.push("The depth of field is very shallow for this scene.");
      actions.push(
        "Stop down the aperture slightly and compare how much more of the subject stays sharp.",
      );
    }

    if (!issues.length) {
      issues.push(
        "The main opportunity is to make the assignment's intended subject even more visually dominant.",
      );
    }

    if (!actions.length) {
      actions.push(
        "Reframe one element toward a third and capture a second comparison frame.",
      );
    }

    return Promise.resolve({
      provider: "mock",
      model: "camai-deterministic-review-v1",
      output: {
        summary:
          `This review is based on visible evidence and the supplied context for ${objective}. ` +
          "It is a coaching response, not an objective judgment of artistic value.",
        strengths,
        issues,
        evidence: [
          "The analysis uses the uploaded image context and any provided metadata.",
          "No visual claim is made beyond what the supplied evidence supports.",
        ],
        actions,
        nextExercise: {
          type: "practice",
          title: "Shoot a comparison frame",
          constraints: [
            "Keep the subject and light similar.",
            "Change one camera variable only.",
          ],
          reason:
            "A controlled comparison makes the effect of the chosen setting easier to see.",
        },
        confidence: motionRisk === undefined && noise === undefined
          ? 0.55
          : 0.68,
        modelVersion: "camai-deterministic-review-v1",
        promptVersion: "camai-photo-review-v1",
      },
    });
  },
};
