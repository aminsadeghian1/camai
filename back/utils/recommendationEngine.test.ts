import { assertEquals } from "@std/assert";
import { chooseRecommendation } from "./recommendationEngine.ts";

Deno.test("recommendation prioritizes resuming an in-progress lesson", () => {
  const result = chooseRecommendation({
    inProgressLesson: { lessonId: "l1", title: "Exposure", currentBlock: 2 },
    pendingPractice: { assignmentId: "p1", title: "Shoot" },
    weakSkill: { key: "iso", title: "ISO", state: "learning" },
  });
  assertEquals(result.reasonCode, "RESUME_LESSON");
  assertEquals(result.activityId, "l1");
  assertEquals(result.explanation.includes("block 3"), true);
});

Deno.test("recommendation falls back to pending practice", () => {
  const result = chooseRecommendation({
    pendingPractice: { assignmentId: "p1", title: "Shoot" },
    weakSkill: { key: "iso", title: "ISO", state: "learning" },
  });
  assertEquals(result.reasonCode, "PENDING_PRACTICE");
  assertEquals(result.activityType, "practice");
});

Deno.test("recommendation surfaces weak skills with a reason", () => {
  const result = chooseRecommendation({
    weakSkill: { key: "iso", title: "ISO", state: "learning" },
    labToRepeat: { labId: "lab1", title: "ISO Lab", score: 40 },
  });
  assertEquals(result.reasonCode, "WEAK_SKILL");
  assertEquals(result.explanation.includes("learning"), true);
});

Deno.test("recommendation repeats low-scoring labs", () => {
  const result = chooseRecommendation({
    labToRepeat: { labId: "lab1", title: "ISO Lab", score: 40 },
    nextLesson: { lessonId: "l2", title: "Shutter" },
  });
  assertEquals(result.reasonCode, "LOW_LAB_SCORE");
  assertEquals(result.activityId, "lab1");
});

Deno.test("recommendation defaults to exploring the path", () => {
  const result = chooseRecommendation({});
  assertEquals(result.reasonCode, "EXPLORE_LEARNING_PATH");
  assertEquals(result.priority, 10);
});
