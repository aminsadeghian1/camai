export type LabType =
  | "shutter"
  | "aperture"
  | "iso"
  | "depthOfField"
  | "focalLength"
  | "cameraDistance"
  | "exposureTriangle"
  | "freeExperiment";

export type LabControls = {
  shutterSeconds?: number;
  aperture?: number;
  iso?: number;
  focalLength?: number;
  focusDistance?: number;
  cameraDistance?: number;
  subjectSpeed?: number;
};

export type LabMetrics = {
  exposureValue?: number;
  motionBlurRisk?: number;
  noise?: number;
  fieldOfView?: number;
  depthOfFieldNear?: number;
  depthOfFieldFar?: number;
  depthOfFieldTotal?: number;
  perspectiveRatio?: number;
  framingScale?: number;
};

export type LabScore = {
  score: number;
  passed: boolean;
  metrics: LabMetrics;
  matchedControls: number;
  expectedControls: number;
};

const COC_MM = 0.03;
const SENSOR_WIDTH_MM = 36;
const DEFAULT_APERTURE = 2.8;
const DEFAULT_SHUTTER = 1 / 125;
const DEFAULT_ISO = 100;
const DEFAULT_FOCAL = 50;
const DEFAULT_FOCUS = 3;
const DEFAULT_DISTANCE = 3;

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export const exposureValue = (
  aperture = DEFAULT_APERTURE,
  shutterSeconds = DEFAULT_SHUTTER,
  iso = DEFAULT_ISO,
): number => Math.log2((aperture * aperture) / shutterSeconds) -
  Math.log2(iso / 100);

export const motionBlurRisk = (
  shutterSeconds = DEFAULT_SHUTTER,
  subjectSpeed = 1,
): number => clamp((shutterSeconds * subjectSpeed) / (1 / 30), 0, 1);

export const noiseLevel = (iso = DEFAULT_ISO): number =>
  clamp(Math.log2(Math.max(iso, 1) / 100) / 6, 0, 1);

export const fieldOfView = (
  focalLength = DEFAULT_FOCAL,
  sensorWidth = SENSOR_WIDTH_MM,
): number => 2 * Math.atan(sensorWidth / (2 * focalLength)) * (180 / Math.PI);

export const depthOfField = (
  aperture = DEFAULT_APERTURE,
  focalLength = DEFAULT_FOCAL,
  focusDistance = DEFAULT_FOCUS,
): { near: number; far: number; total: number; hyperfocal: number } => {
  const focal = Math.max(focalLength, 0.1);
  const focusMm = Math.max(focusDistance, 0.01) * 1000;
  const hyperfocalMm = (focal * focal) / (aperture * COC_MM) + focal;
  const nearMm = (hyperfocalMm * focusMm) / (hyperfocalMm + focusMm - focal);
  const farDenominator = hyperfocalMm - focusMm + focal;
  const farMm = farDenominator <= 0
    ? Number.POSITIVE_INFINITY
    : (hyperfocalMm * focusMm) / farDenominator;

  return {
    near: nearMm / 1000,
    far: Number.isFinite(farMm) ? farMm / 1000 : Number.POSITIVE_INFINITY,
    total: Number.isFinite(farMm) ? (farMm - nearMm) / 1000 : Infinity,
    hyperfocal: hyperfocalMm / 1000,
  };
};

export const deriveLabMetrics = (
  labType: LabType,
  controls: LabControls,
): LabMetrics => {
  const aperture = controls.aperture ?? DEFAULT_APERTURE;
  const shutterSeconds = controls.shutterSeconds ?? DEFAULT_SHUTTER;
  const iso = controls.iso ?? DEFAULT_ISO;
  const focalLength = controls.focalLength ?? DEFAULT_FOCAL;
  const focusDistance = controls.focusDistance ?? DEFAULT_FOCUS;
  const cameraDistance = controls.cameraDistance ?? DEFAULT_DISTANCE;
  const dof = depthOfField(aperture, focalLength, focusDistance);

  const base: LabMetrics = {
    exposureValue: exposureValue(aperture, shutterSeconds, iso),
    motionBlurRisk: motionBlurRisk(
      shutterSeconds,
      controls.subjectSpeed ?? 1,
    ),
    noise: noiseLevel(iso),
    fieldOfView: fieldOfView(focalLength),
    depthOfFieldNear: dof.near,
    depthOfFieldFar: dof.far,
    depthOfFieldTotal: dof.total,
    perspectiveRatio: cameraDistance / Math.max(focalLength / 50, 0.01),
    framingScale: focalLength / DEFAULT_FOCAL,
  };

  switch (labType) {
    case "shutter":
      return {
        exposureValue: base.exposureValue,
        motionBlurRisk: base.motionBlurRisk,
      };
    case "aperture":
      return {
        exposureValue: base.exposureValue,
        depthOfFieldTotal: base.depthOfFieldTotal,
        depthOfFieldNear: base.depthOfFieldNear,
        depthOfFieldFar: base.depthOfFieldFar,
      };
    case "iso":
      return { exposureValue: base.exposureValue, noise: base.noise };
    case "depthOfField":
      return {
        depthOfFieldNear: base.depthOfFieldNear,
        depthOfFieldFar: base.depthOfFieldFar,
        depthOfFieldTotal: base.depthOfFieldTotal,
      };
    case "focalLength":
      return {
        fieldOfView: base.fieldOfView,
        framingScale: base.framingScale,
      };
    case "cameraDistance":
      return {
        perspectiveRatio: base.perspectiveRatio,
        framingScale: base.framingScale,
      };
    default:
      return base;
  }
};

const numericEntries = (value: unknown): [string, number][] => {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value as Record<string, unknown>).filter(
    (entry): entry is [string, number] =>
      typeof entry[1] === "number" && Number.isFinite(entry[1]),
  );
};

const closeness = (actual: number, expected: number): number => {
  const scale = Math.max(Math.abs(expected), 1e-9);
  return clamp(1 - Math.abs(actual - expected) / scale, 0, 1);
};

export const scoreLabAttempt = ({
  labType,
  controls,
  derivedMetrics,
  challengeRules,
  prediction,
}: {
  labType: LabType;
  controls: LabControls;
  derivedMetrics?: LabMetrics;
  challengeRules?: { target?: Record<string, unknown>; passScore?: number };
  prediction?: { metric?: string; value?: number };
}): LabScore => {
  const metrics = {
    ...deriveLabMetrics(labType, controls),
    ...(derivedMetrics ?? {}),
  };
  const target = numericEntries(challengeRules?.target);
  const expectedControls = target.length;
  let matchedControls = 0;
  let score = 100;

  if (expectedControls > 0) {
    const total = target.reduce((sum, [key, expected]) => {
      const actual = controls[key as keyof LabControls];
      if (typeof actual !== "number") return sum;
      matchedControls++;
      return sum + closeness(actual, expected);
    }, 0);
    score = Math.round((total / expectedControls) * 100);
  } else if (
    prediction?.metric && typeof prediction.value === "number" &&
    typeof metrics[prediction.metric as keyof LabMetrics] === "number"
  ) {
    score = Math.round(
      closeness(
        metrics[prediction.metric as keyof LabMetrics] as number,
        prediction.value,
      ) * 100,
    );
  }

  const passScore = challengeRules?.passScore ?? 70;

  return {
    score: clamp(score, 0, 100),
    passed: score >= passScore,
    metrics,
    matchedControls,
    expectedControls,
  };
};
