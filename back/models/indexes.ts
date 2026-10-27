import { coreApp } from "../mod.ts";

const collection = (name: string) => coreApp.odm.getCollection(name);

export const createIndexes = async () => {
  const user = collection("user");
  await user.createIndex({ email: 1 }, { unique: true });
  await user.createIndex({ status: 1, createdAt: -1 });
  await user.createIndex({ displayName: "text", email: "text" });

  const session = collection("session");
  await session.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await session.createIndex({ "user._id": 1, revokedAt: 1 });

  const file = collection("file");
  await file.createIndex({ "owner._id": 1, createdAt: -1 });
  await file.createIndex({ status: 1, createdAt: -1 });

  const contentModels = [
    "learningPath",
    "course",
    "module",
    "lesson",
    "lab",
    "labScene",
    "labChallenge",
  ];
  for (const name of contentModels) {
    await collection(name).createIndex({ status: 1 });
    await collection(name).createIndex({ key: 1, version: -1 });
    await collection(name).createIndex({ createdAt: -1 });
  }
  await collection("lesson").createIndex({ "module._id": 1, order: 1 });
  await collection("course").createIndex({ "path._id": 1, order: 1 });
  await collection("module").createIndex({ "course._id": 1, order: 1 });
  await collection("lab").createIndex({ "lesson._id": 1 });
  await collection("labChallenge").createIndex({ "lab._id": 1 });

  const lessonProgress = collection("lessonProgress");
  await lessonProgress.createIndex(
    { "user._id": 1, "lesson._id": 1 },
    { unique: true },
  );
  await lessonProgress.createIndex({ "user._id": 1, updatedAt: -1 });
  await lessonProgress.createIndex({ "lesson._id": 1, status: 1 });

  const labAttempt = collection("labAttempt");
  await labAttempt.createIndex(
    { "user._id": 1, operationId: 1 },
    { unique: true },
  );
  await labAttempt.createIndex({ "user._id": 1, updatedAt: -1 });
  await labAttempt.createIndex({ "lab._id": 1, createdAt: -1 });

  const labEvent = collection("labEvent");
  await labEvent.createIndex(
    { "attempt._id": 1, operationId: 1 },
    { unique: true },
  );
  await labEvent.createIndex({ "attempt._id": 1, createdAt: 1 });

  await collection("labResult").createIndex({
    "attempt._id": 1,
    createdAt: -1,
  });

  const practiceAssignment = collection("practiceAssignment");
  await practiceAssignment.createIndex({ "user._id": 1, updatedAt: -1 });
  await practiceAssignment.createIndex({ "user._id": 1, status: 1 });
  await practiceAssignment.createIndex({ "lesson._id": 1 });

  const practiceSubmission = collection("practiceSubmission");
  await practiceSubmission.createIndex(
    { "assignment._id": 1, operationId: 1 },
    { unique: true },
  );
  await practiceSubmission.createIndex({ "assignment._id": 1, createdAt: -1 });
  await practiceSubmission.createIndex({ status: 1, createdAt: -1 });

  const note = collection("note");
  await note.createIndex(
    { "user._id": 1, operationId: 1 },
    { unique: true },
  );
  await note.createIndex({ "user._id": 1, updatedAt: -1 });
  await note.createIndex({ targetType: 1, targetId: 1 });
  await note.createIndex({ "user._id": 1, isPinned: -1, updatedAt: -1 });

  const aiReview = collection("aiReview");
  await aiReview.createIndex({ status: 1, createdAt: -1 });
  await aiReview.createIndex({ "user._id": 1, createdAt: -1 });
  await aiReview.createIndex({ "submission._id": 1, createdAt: -1 });

  const job = collection("job");
  await job.createIndex({ idempotencyKey: 1 }, { unique: true });
  await job.createIndex({ status: 1, runAt: 1 });
  await job.createIndex({ queue: 1, status: 1 });

  const skill = collection("skill");
  await skill.createIndex({ key: 1 }, { unique: true });

  const skillProgress = collection("skillProgress");
  await skillProgress.createIndex(
    { "user._id": 1, "skill._id": 1 },
    { unique: true },
  );
  await skillProgress.createIndex({ "user._id": 1, updatedAt: -1 });
  await skillProgress.createIndex({ "user._id": 1, state: 1 });

  const recommendation = collection("recommendation");
  await recommendation.createIndex({ "user._id": 1, createdAt: -1 });
  await recommendation.createIndex({ "user._id": 1, status: 1 });

  const achievement = collection("achievement");
  await achievement.createIndex({ key: 1 }, { unique: true });

  const userAchievement = collection("userAchievement");
  await userAchievement.createIndex(
    { "user._id": 1, "achievement._id": 1 },
    { unique: true },
  );
  await userAchievement.createIndex({ "user._id": 1, awardedAt: -1 });

  const analyticsEvent = collection("analyticsEvent");
  await analyticsEvent.createIndex(
    { createdAt: 1 },
    { expireAfterSeconds: 60 * 60 * 24 * 90 },
  );
  await analyticsEvent.createIndex({ eventType: 1, createdAt: -1 });
  await analyticsEvent.createIndex(
    { operationId: 1 },
    { unique: true, sparse: true },
  );
  await analyticsEvent.createIndex({ "user._id": 1, createdAt: -1 });

  const auditLog = collection("auditLog");
  await auditLog.createIndex({ createdAt: -1 });
  await auditLog.createIndex({ targetType: 1, targetId: 1 });
  await auditLog.createIndex({ "adminUser._id": 1, createdAt: -1 });

  const notification = collection("notification");
  await notification.createIndex({ "user._id": 1, readAt: 1, createdAt: -1 });
  await notification.createIndex(
    { "user._id": 1, dedupeKey: 1 },
    {
      unique: true,
      partialFilterExpression: { dedupeKey: { $type: "string" } },
    },
  );
};
