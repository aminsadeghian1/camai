import { assertEquals } from "@std/assert";
import { resolveResume } from "./resumeResolver.ts";

Deno.test("resume reports a fresh lesson as Start", () => {
  const result = resolveResume({
    blockIds: ["a", "b", "c"],
    completedBlockIds: [],
  });
  assertEquals(result.resumeLabel, "Start");
  assertEquals(result.currentBlock, 0);
  assertEquals(result.firstIncompleteBlock, 0);
  assertEquals(result.completed, false);
});

Deno.test("resume continues at the first incomplete block", () => {
  const result = resolveResume({
    blockIds: ["a", "b", "c", "d"],
    completedBlockIds: ["a", "b"],
    currentBlock: 1,
  });
  assertEquals(result.resumeLabel, "Continue");
  assertEquals(result.currentBlock, 2);
  assertEquals(result.lastCompletedBlock, 1);
  assertEquals(result.completed, false);
});

Deno.test("resume reviews a completed lesson at the final block", () => {
  const result = resolveResume({
    blockIds: ["a", "b", "c"],
    completedBlockIds: ["a", "b", "c"],
    status: "completed",
  });
  assertEquals(result.resumeLabel, "Review");
  assertEquals(result.currentBlock, 2);
  assertEquals(result.completed, true);
  assertEquals(result.firstIncompleteBlock, 3);
});

Deno.test("resume treats all blocks complete as completed even without status", () => {
  const result = resolveResume({
    blockIds: ["a", "b"],
    completedBlockIds: ["a", "b"],
  });
  assertEquals(result.resumeLabel, "Review");
  assertEquals(result.completed, true);
});

Deno.test("resume tolerates missing block ids and negative positions", () => {
  const result = resolveResume({ currentBlock: -4, blockIds: [] });
  assertEquals(result.currentBlock, 0);
  assertEquals(result.completed, false);
  assertEquals(result.lastCompletedBlock, -1);
});

Deno.test("resume clamps out-of-range current blocks", () => {
  const result = resolveResume({
    blockIds: ["a", "b", "c"],
    completedBlockIds: [],
    currentBlock: 99,
  });
  assertEquals(result.currentBlock, 0);
});
