import { assertEquals } from "@std/assert";
import {
  depthOfField,
  deriveLabMetrics,
  exposureValue,
  fieldOfView,
  motionBlurRisk,
  noiseLevel,
  scoreLabAttempt,
} from "./labScoring.ts";

const assertLess = (actual: number, expected: number) => {
  if (!(actual < expected)) {
    throw new Error(`Expected ${actual} to be less than ${expected}`);
  }
};

const assertGreater = (actual: number, expected: number) => {
  if (!(actual > expected)) {
    throw new Error(`Expected ${actual} to be greater than ${expected}`);
  }
};

Deno.test("faster shutter reduces exposure time and motion blur", () => {
  assertGreater(
    exposureValue(2.8, 1 / 125, 100),
    exposureValue(2.8, 1 / 30, 100),
  );
  assertLess(motionBlurRisk(1 / 125), motionBlurRisk(1 / 30));
  assertLess(motionBlurRisk(1 / 2000), motionBlurRisk(1 / 125));
});

Deno.test("smaller aperture deepens depth of field", () => {
  const wide = depthOfField(1.4, 50, 3);
  const narrow = depthOfField(8, 50, 3);
  assertGreater(narrow.total, wide.total);
});

Deno.test("higher ISO increases simulated noise", () => {
  assertGreater(noiseLevel(6400), noiseLevel(100));
});

Deno.test("longer focal length narrows field of view", () => {
  assertGreater(fieldOfView(24), fieldOfView(85));
  assertGreater(fieldOfView(85), fieldOfView(200));
});

Deno.test("closer focus changes the depth-of-field relationship", () => {
  const farFocus = depthOfField(2.8, 50, 10);
  const nearFocus = depthOfField(2.8, 50, 1);
  assertLess(nearFocus.near, farFocus.near);
  assertLess(nearFocus.total, farFocus.total);
});

Deno.test("moving the camera changes the perspective relationship", () => {
  const close = deriveLabMetrics("cameraDistance", { cameraDistance: 1 });
  const distant = deriveLabMetrics("cameraDistance", { cameraDistance: 10 });
  assertLess(
    close.perspectiveRatio as number,
    distant.perspectiveRatio as number,
  );
});

Deno.test("derived lab metrics expose the expected lab controls", () => {
  const shutter = deriveLabMetrics("shutter", { shutterSeconds: 1 / 500 });
  assertEquals(Object.keys(shutter).sort(), [
    "exposureValue",
    "motionBlurRisk",
  ]);

  const aperture = deriveLabMetrics("aperture", { aperture: 8 });
  assertEquals(Object.keys(aperture).sort(), [
    "depthOfFieldFar",
    "depthOfFieldNear",
    "depthOfFieldTotal",
    "exposureValue",
  ]);
});

Deno.test("scoreLabAttempt matches numeric targets and pass score", () => {
  const exact = scoreLabAttempt({
    labType: "shutter",
    controls: { shutterSeconds: 1 / 125 },
    challengeRules: { target: { shutterSeconds: 1 / 125 }, passScore: 70 },
  });
  assertEquals(exact.score, 100);
  assertEquals(exact.passed, true);

  const wrong = scoreLabAttempt({
    labType: "shutter",
    controls: { shutterSeconds: 1 / 30 },
    challengeRules: { target: { shutterSeconds: 1 / 125 }, passScore: 90 },
  });
  assertEquals(wrong.score, 0);
  assertEquals(wrong.passed, false);
});

Deno.test("scoreLabAttempt grades predictions against derived metrics", () => {
  const result = scoreLabAttempt({
    labType: "iso",
    controls: { iso: 6400 },
    prediction: { metric: "noise", value: noiseLevel(6400) },
  });
  assertEquals(result.score, 100);
});

Deno.test("scoreLabAttempt clamps scores to 0..100", () => {
  const result = scoreLabAttempt({
    labType: "focalLength",
    controls: { focalLength: 1000 },
    challengeRules: { target: { focalLength: 100 }, passScore: 100 },
  });
  assertEquals(result.score, 0);
  assertEquals(result.passed, false);
});

Deno.test("lab scoring ignores non-numeric target rules", () => {
  const result = scoreLabAttempt({
    labType: "shutter",
    controls: { shutterSeconds: 1 / 125 },
    challengeRules: { target: { shutterSeconds: "fast" } },
  });
  assertEquals(result.expectedControls, 0);
  assertEquals(result.score, 100);
});

Deno.test("exposure helpers tolerate missing controls", () => {
  const metrics = deriveLabMetrics("freeExperiment", {});
  assertEquals(typeof metrics.exposureValue, "number");
  assertEquals(typeof metrics.depthOfFieldTotal, "number");
});
