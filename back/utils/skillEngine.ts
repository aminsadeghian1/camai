import { ObjectId } from "lesan";
import { skill, skillProgress } from "../mod.ts";
import type { LabType } from "./labScoring.ts";
import { clamp } from "./labScoring.ts";

export const ALGORITHM_VERSION = "1.0";

export const mastery_state_array = [
  "unseen",
  "learning",
  "practicing",
  "competent",
  "mastered",
] as const;

export type MasteryState = (typeof mastery_state_array)[number];

export type SkillEvidence = {
  type: string;
  refId?: string;
  score: number;
  at: Date;
};

export type SkillEvaluation = {
  state: MasteryState;
  confidence: number;
  weightedAverage: number;
  totalWeight: number;
};

export const SKILL_CATALOG: Record<string, string> = {
  shutterControl: "Shutter Control",
  apertureControl: "Aperture Control",
  isoControl: "ISO Control",
  depthOfField: "Depth of Field",
  focalLength: "Focal Length",
  cameraDistance: "Camera Distance",
  exposure: "Exposure",
  composition: "Composition",
  lighting: "Lighting",
  focus: "Focus",
  creativeControl: "Creative Control",
};

export const skillKeyForLab = (labType: LabType): string => {
  switch (labType) {
    case "shutter":
      return "shutterControl";
    case "aperture":
      return "apertureControl";
    case "iso":
      return "isoControl";
    case "depthOfField":
      return "depthOfField";
    case "focalLength":
      return "focalLength";
    case "cameraDistance":
      return "cameraDistance";
    case "exposureTriangle":
      return "exposure";
    default:
      return "creativeControl";
  }
};

const evidenceWeight = (evidence: SkillEvidence, now: number): number => {
  const base = {
    lesson: 1,
    prediction: 1.2,
    lab: 1.5,
    challenge: 1.8,
    practice: 2,
    aiReview: 2,
  }[evidence.type] ?? 1;

  const ageDays = Math.max(
    0,
    (now - new Date(evidence.at).getTime()) / 86_400_000,
  );
  const recency = ageDays <= 30 ? 1.2 : ageDays <= 90 ? 1 : 0.8;
  return base * recency;
};

export const evaluateSkill = (
  evidence: SkillEvidence[],
  now = Date.now(),
): SkillEvaluation => {
  if (!evidence.length) {
    return {
      state: "unseen",
      confidence: 0,
      weightedAverage: 0,
      totalWeight: 0,
    };
  }

  let weightedTotal = 0;
  let totalWeight = 0;

  for (const item of evidence) {
    const weight = evidenceWeight(item, now);
    weightedTotal += clamp(item.score, 0, 100) * weight;
    totalWeight += weight;
  }

  const weightedAverage = totalWeight > 0 ? weightedTotal / totalWeight : 0;
  let state: MasteryState = "learning";

  if (totalWeight < 1.5) state = "learning";
  else if (totalWeight < 3.5) state = "practicing";
  else if (totalWeight < 6) state = "competent";
  else if (weightedAverage >= 75) state = "mastered";
  else state = "competent";

  return {
    state,
    confidence: Math.round(clamp(totalWeight / 9, 0, 1) * 100) / 100,
    weightedAverage: Math.round(weightedAverage * 10) / 10,
    totalWeight: Math.round(totalWeight * 10) / 10,
  };
};

export const ensureSkill = async (skillKey: string) => {
  const existing = await skill.findOne({ filters: { key: skillKey } });
  if (existing) return existing;

  try {
    return await skill.insertOne({
      doc: {
        key: skillKey,
        title: SKILL_CATALOG[skillKey] ?? skillKey,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  } catch {
    return await skill.findOne({ filters: { key: skillKey } });
  }
};

export const applySkillEvidence = async ({
  userId,
  skillKey,
  type,
  refId,
  score,
}: {
  userId: string;
  skillKey: string;
  type: string;
  refId?: string;
  score: number;
}) => {
  const foundedSkill = await ensureSkill(skillKey);
  if (!foundedSkill) throw new Error("Could not resolve skill");

  const existing = await skillProgress.findOne({
    filters: {
      "user._id": new ObjectId(userId),
      "skill._id": new ObjectId(String(foundedSkill._id)),
    },
    projection: { _id: 1, evidence: 1 },
  });

  const evidence = (existing?.evidence as SkillEvidence[] | undefined) ?? [];
  const nextEvidence = [
    ...evidence,
    { type, refId, score: clamp(score, 0, 100), at: new Date() },
  ].slice(-50);
  const evaluation = evaluateSkill(nextEvidence);

  if (existing) {
    return await skillProgress.findOneAndUpdate({
      filter: { _id: new ObjectId(String(existing._id)) },
      update: {
        $set: {
          state: evaluation.state,
          confidence: evaluation.confidence,
          evidence: nextEvidence,
          algorithmVersion: ALGORITHM_VERSION,
          updatedAt: new Date(),
        },
      },
      projection: {
        _id: 1,
        state: 1,
        confidence: 1,
        evidence: 1,
        algorithmVersion: 1,
      },
    });
  }

  return await skillProgress.insertOne({
    doc: {
      state: evaluation.state,
      confidence: evaluation.confidence,
      evidence: nextEvidence,
      algorithmVersion: ALGORITHM_VERSION,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    relations: {
      user: { _ids: new ObjectId(userId) },
      skill: { _ids: new ObjectId(String(foundedSkill._id)) },
    },
    projection: {
      _id: 1,
      state: 1,
      confidence: 1,
      evidence: 1,
      algorithmVersion: 1,
    },
  });
};
