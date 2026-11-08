import { type ActFn, ObjectId } from "lesan";
import {
  labAttempt,
  lesson,
  lessonProgress,
  practiceAssignment,
  recommendation,
  skillProgress,
} from "../../../mod.ts";
import { chooseRecommendation, getAuth } from "@lib";

const firstDoc = <T>(docs: T[]): T | undefined => docs[0];

export const getNextFn: ActFn = async (body) => {
  const { get } = body.details;
  const { user } = await getAuth();
  const userId = new ObjectId(String(user._id));

  const [inProgressDocs, pendingDocs, weakDocs, repeatDocs] = await Promise
    .all([
      lessonProgress.aggregation({
        pipeline: [
          {
            $match: {
              "user._id": userId,
              status: "inProgress",
            },
          },
          { $sort: { updatedAt: -1, _id: -1 } },
          { $limit: 1 },
        ],
        projection: {
          currentBlock: 1,
          lesson: { _id: 1, title: 1 },
        },
      }).toArray(),
      practiceAssignment.aggregation({
        pipeline: [
          {
            $match: {
              "user._id": userId,
              status: { $in: ["assigned", "inProgress"] },
            },
          },
          { $sort: { createdAt: -1, _id: -1 } },
          { $limit: 1 },
        ],
        projection: { _id: 1, title: 1 },
      }).toArray(),
      skillProgress.aggregation({
        pipeline: [
          {
            $match: {
              "user._id": userId,
              state: { $in: ["learning", "practicing"] },
            },
          },
          { $sort: { confidence: 1, updatedAt: -1 } },
          { $limit: 1 },
        ],
        projection: {
          state: 1,
          confidence: 1,
          skill: { _id: 1, key: 1, title: 1 },
        },
      }).toArray(),
      labAttempt.aggregation({
        pipeline: [
          {
            $match: {
              "user._id": userId,
              completedAt: { $exists: true },
              "challengeResult.score": { $lt: 70 },
            },
          },
          { $sort: { completedAt: -1, _id: -1 } },
          { $limit: 1 },
        ],
        projection: {
          _id: 1,
          challengeResult: 1,
          lab: { _id: 1, title: 1 },
        },
      }).toArray(),
    ]);

  const inProgress = firstDoc(inProgressDocs) as
    | {
      currentBlock?: number;
      lesson?: { _id?: unknown; title?: string };
    }
    | undefined;
  const pending = firstDoc(pendingDocs) as
    | { _id?: unknown; title?: string }
    | undefined;
  const weak = firstDoc(weakDocs) as
    | {
      state?: string;
      skill?: { _id?: unknown; key?: string; title?: string };
    }
    | undefined;
  const repeat = firstDoc(repeatDocs) as
    | {
      challengeResult?: { score?: number };
      lab?: { _id?: unknown; title?: string };
    }
    | undefined;

  let nextLesson:
    | { _id?: unknown; title?: string }
    | undefined;

  if (!inProgress && !pending) {
    const completed = await lessonProgress.aggregation({
      pipeline: [
        {
          $match: {
            "user._id": userId,
            status: "completed",
            "lesson._id": { $exists: true },
          },
        },
        { $group: { _id: "$lesson._id" } },
      ],
      projection: { _id: 1 },
    }).toArray();
    const completedIds = completed.map((item) =>
      new ObjectId(String(item._id))
    );

    const nextDocs = await lesson.aggregation({
      pipeline: [
        {
          $match: {
            status: "Published",
            ...(completedIds.length ? { _id: { $nin: completedIds } } : {}),
          },
        },
        { $sort: { order: 1, _id: 1 } },
        { $limit: 1 },
      ],
      projection: { _id: 1, title: 1 },
    }).toArray();

    nextLesson = firstDoc(nextDocs) as
      | { _id?: unknown; title?: string }
      | undefined;
  }

  const candidate = chooseRecommendation({
    ...(inProgress?.lesson?._id
      ? {
        inProgressLesson: {
          lessonId: String(inProgress.lesson._id),
          title: inProgress.lesson.title ?? "your lesson",
          currentBlock: Number(inProgress.currentBlock ?? 0),
        },
      }
      : {}),
    ...(pending?._id
      ? {
        pendingPractice: {
          assignmentId: String(pending._id),
          title: pending.title ?? "practice assignment",
        },
      }
      : {}),
    ...(weak?.skill?._id
      ? {
        weakSkill: {
          key: weak.skill.key ?? "skill",
          title: weak.skill.title ?? weak.skill.key ?? "skill",
          state: weak.state ?? "learning",
        },
      }
      : {}),
    ...(repeat?.lab?._id && typeof repeat.challengeResult?.score === "number"
      ? {
        labToRepeat: {
          labId: String(repeat.lab._id),
          title: repeat.lab.title ?? "photo lab",
          score: repeat.challengeResult.score,
        },
      }
      : {}),
    ...(nextLesson?._id
      ? {
        nextLesson: {
          lessonId: String(nextLesson._id),
          title: nextLesson.title ?? "the next lesson",
        },
      }
      : {}),
  });

  const match: Record<string, unknown> = {
    "user._id": userId,
    reasonCode: candidate.reasonCode,
  };
  if (candidate.activityId) match.activityId = candidate.activityId;

  const existing = await recommendation.findOne({
    filters: match,
    projection: { _id: 1, status: 1 },
  });
  const now = new Date();

  if (existing && ["new", "shown"].includes(String(existing.status))) {
    return await recommendation.findOneAndUpdate({
      filter: { _id: new ObjectId(String(existing._id)) },
      update: { $set: { status: "shown", updatedAt: now } },
      projection: get,
    });
  }

  const created = await recommendation.insertOne({
    doc: {
      reasonCode: candidate.reasonCode,
      activityType: candidate.activityType,
      ...(candidate.activityId ? { activityId: candidate.activityId } : {}),
      explanation: candidate.explanation,
      status: "shown",
      createdAt: now,
      updatedAt: now,
    },
    relations: { user: { _ids: userId } },
    projection: get,
  });

  return created;
};
