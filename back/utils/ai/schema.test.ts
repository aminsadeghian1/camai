import { assertEquals } from "@std/assert";
import { AppError, isAppError } from "../throwError.ts";
import { validateAiOutput } from "./schema.ts";

const captured = (fn: () => unknown): AppError => {
  try {
    fn();
  } catch (error) {
    if (isAppError(error)) return error;
    throw error;
  }
  throw new Error("Expected function to throw");
};

const valid = () => ({
  summary: "Good composition.",
  strengths: ["framing"],
  issues: [],
  evidence: ["rule of thirds"],
  actions: ["shoot again"],
  nextExercise: { title: "Framing drill" },
  confidence: 0.8,
  modelVersion: "test-1",
  promptVersion: "1.0",
});

Deno.test("accepts a complete review", () => {
  const result = validateAiOutput(valid());
  assertEquals(result.summary, "Good composition.");
  assertEquals(result.confidence, 0.8);
  assertEquals(result.strengths, ["framing"]);
});

Deno.test("rejects non-object output", () => {
  assertEquals(captured(() => validateAiOutput(null)).code, "AI_UNAVAILABLE");
  assertEquals(captured(() => validateAiOutput([])).code, "AI_UNAVAILABLE");
});

Deno.test("rejects missing or empty summary", () => {
  assertEquals(
    captured(() => validateAiOutput({ ...valid(), summary: "" })).code,
    "VALIDATION_FAILED",
  );
  assertEquals(
    captured(() => validateAiOutput({ ...valid(), summary: 4 })).code,
    "VALIDATION_FAILED",
  );
});

Deno.test("rejects confidence outside 0..1", () => {
  assertEquals(
    captured(() => validateAiOutput({ ...valid(), confidence: 2 })).code,
    "VALIDATION_FAILED",
  );
  assertEquals(
    captured(() => validateAiOutput({ ...valid(), confidence: "nan" })).code,
    "VALIDATION_FAILED",
  );
});

Deno.test("rejects a missing next exercise", () => {
  assertEquals(
    captured(() => validateAiOutput({ ...valid(), nextExercise: null })).code,
    "VALIDATION_FAILED",
  );
});

Deno.test("rejects non-string arrays and defaults missing arrays", () => {
  assertEquals(
    captured(() => validateAiOutput({ ...valid(), strengths: [1] })).code,
    "VALIDATION_FAILED",
  );
  const result = validateAiOutput({
    summary: "ok",
    confidence: 0,
    nextExercise: {},
  });
  assertEquals(result.strengths, []);
  assertEquals(result.issues, []);
  assertEquals(result.modelVersion, "unknown");
});
