import { ObjectId } from "lesan";
import { aiReview } from "../../mod.ts";
import { throwError } from "../throwError.ts";
import { buildPrompt, PROMPT_VERSION } from "./prompts.ts";
import { configuredProviders } from "./providers/index.ts";
import { sanitizeAiOutput } from "./truthfulness.ts";
import type { AiReviewInput, AiReviewOutput } from "./types.ts";
import { validateAiOutput } from "./schema.ts";

const dailyQuota = Number(Deno.env.get("AI_DAILY_QUOTA") || 20);

export const checkAiQuota = async (userId: string): Promise<void> => {
  if (!Number.isFinite(dailyQuota) || dailyQuota <= 0) {
    throwError("QUOTA_EXCEEDED: AI review quota is disabled");
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const used = await aiReview.countDocument({
    filter: {
      "user._id": new ObjectId(userId),
      createdAt: { $gte: startOfDay },
    },
  });

  if (used >= dailyQuota) {
    throwError("QUOTA_EXCEEDED: Daily AI review quota reached");
  }
};

export type AiReviewExecution = {
  provider: string;
  model: string;
  promptVersion: string;
  reviewVersion: string;
  result: AiReviewOutput;
};

export const runAiReview = async (
  userId: string,
  input: AiReviewInput,
): Promise<AiReviewExecution> => {
  await checkAiQuota(userId);

  const prompt = buildPrompt(input);
  const errors: string[] = [];

  for (const provider of configuredProviders()) {
    try {
      const generated = await provider.generate(input, prompt);
      const validated = validateAiOutput(generated.output);
      const sanitized = sanitizeAiOutput(validated, input);

      return {
        provider: generated.provider,
        model: generated.model,
        promptVersion: PROMPT_VERSION,
        reviewVersion: "1.0",
        result: sanitized,
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  throwError(
    `AI_UNAVAILABLE: All AI providers failed${
      errors.length ? ` (${errors.join("; ")})` : ""
    }`,
  );
};
