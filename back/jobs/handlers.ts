import { ObjectId } from "lesan";
import {
  aiReview,
  coreApp,
  file,
  notification,
  practiceAssignment,
  practiceSubmission,
} from "../mod.ts";
import { runAiReview } from "../utils/ai/gateway.ts";
import type { AiReviewInput } from "../utils/ai/types.ts";
import { applySkillEvidence } from "../utils/skillEngine.ts";
import { clamp, deriveLabMetrics } from "../utils/labScoring.ts";
import { getStorage } from "../utils/storage/index.ts";

type LockedJob = {
  _id: unknown;
  queue: string;
  attempts?: number;
  payload: Record<string, unknown>;
};

const userCollection = () => coreApp.odm.getCollection("user");
const sessionCollection = () => coreApp.odm.getCollection("session");
const noteCollection = () => coreApp.odm.getCollection("note");
const fileCollection = () => coreApp.odm.getCollection("file");
const jobCollection = () => coreApp.odm.getCollection("job");
const notificationCollection = () => coreApp.odm.getCollection("notification");

const createNotification = async ({
  userId,
  type,
  title,
  body,
  dedupeKey,
}: {
  userId: string;
  type: string;
  title: string;
  body: string;
  dedupeKey: string;
}) => {
  try {
    await notification.insertOne({
      doc: {
        type,
        title,
        body,
        dedupeKey,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      relations: { user: { _ids: new ObjectId(userId) } },
    });
  } catch {
    // Duplicate dedupe keys are intentionally ignored.
  }
};

const handleAiReview = async (lockedJob: LockedJob) => {
  const reviewId = String(lockedJob.payload.reviewId ?? "");
  if (!ObjectId.isValid(reviewId)) {
    throw new Error("Invalid aiReview job payload");
  }

  const foundedReview = await aiReview.findOne({
    filters: { _id: new ObjectId(reviewId) },
    projection: {
      _id: 1,
      status: 1,
      submission: { _id: 1 },
      user: { _id: 1 },
    },
  });

  if (!foundedReview) throw new Error("AI review not found");
  if (foundedReview.status === "valid") return;

  const submissionId = String(
    (foundedReview.submission as { _id?: unknown } | undefined)?._id ?? "",
  );
  const submission = await practiceSubmission.findOne({
    filters: { _id: new ObjectId(submissionId) },
    projection: {
      _id: 1,
      assignment: { _id: 1 },
      media: { _id: 1 },
      note: 1,
      exif: 1,
    },
  });

  if (!submission) throw new Error("Submission not found");

  const assignmentId = String(
    (submission.assignment as { _id?: unknown } | undefined)?._id ?? "",
  );
  const assignment = await practiceAssignment.findOne({
    filters: { _id: new ObjectId(assignmentId) },
    projection: {
      _id: 1,
      title: 1,
      objective: 1,
      constraints: 1,
      requirements: 1,
      user: { _id: 1 },
      lesson: { _id: 1, title: 1, objective: 1 },
      skill: { _id: 1, key: 1, title: 1 },
    },
  });

  if (!assignment) throw new Error("Practice assignment not found");

  const ownerId = String(
    (assignment.user as { _id?: unknown } | undefined)?._id ?? "",
  );
  const mediaId = String(
    (submission.media as { _id?: unknown } | undefined)?._id ?? "",
  );
  const media = mediaId
    ? await file.findOne({
      filters: { _id: new ObjectId(mediaId) },
      projection: {
        _id: 1,
        name: 1,
        mimeType: 1,
        storageKey: 1,
        status: 1,
        metadata: 1,
      },
    })
    : null;

  if (!media || media.status !== "uploaded") {
    throw new Error("Submission media is not ready");
  }

  const exif = (media.metadata as { exif?: Record<string, unknown> } | undefined)
    ?.exif ?? (submission.exif as Record<string, unknown> | undefined) ?? {};
  const controls = {
    aperture: typeof exif.fNumber === "number" ? exif.fNumber : undefined,
    shutterSeconds: typeof exif.exposureTime === "number"
      ? exif.exposureTime
      : undefined,
    iso: typeof exif.iso === "number" ? exif.iso : undefined,
    focalLength: typeof exif.focalLength === "number"
      ? exif.focalLength
      : undefined,
  };
  const hasSettings = Object.values(controls).some((value) =>
    typeof value === "number"
  );
  const technicalAnalysis = hasSettings
    ? { ...deriveLabMetrics("freeExperiment", controls), exifSummary: exif }
    : { exifSummary: exif };

  const storage = getStorage();
  const download = await storage.requestDownload(media, 900);
  const input: AiReviewInput = {
    assignment: {
      title: assignment.title,
      objective: assignment.objective,
      constraints: assignment.constraints,
      requirements: assignment.requirements,
    },
    lessonObjective:
      (assignment.lesson as { objective?: string } | undefined)?.objective,
    learnerLevel: "learner",
    skillState: assignment.skill
      ? {
        key: (assignment.skill as { key?: string }).key,
        title: (assignment.skill as { title?: string }).title,
      }
      : {},
    exif,
    technicalAnalysis,
    imageReference: download.url,
    labEvidence: {},
  };

  const execution = await runAiReview(ownerId, input);

  await aiReview.findOneAndUpdate({
    filter: { _id: new ObjectId(reviewId) },
    update: {
      $set: {
        provider: execution.provider,
        model: execution.model,
        promptVersion: execution.promptVersion,
        reviewVersion: execution.reviewVersion,
        status: "valid",
        result: execution.result,
        attempts: Number(lockedJob.attempts ?? 1),
        errorDiagnostics: null,
        updatedAt: new Date(),
      },
    },
    projection: { _id: 1, status: 1, result: 1 },
  });

  await practiceSubmission.findOneAndUpdate({
    filter: { _id: new ObjectId(submissionId) },
    update: {
      $set: {
        status: "reviewed",
        reviewedAt: new Date(),
        updatedAt: new Date(),
      },
    },
    projection: { _id: 1 },
  });

  await practiceAssignment.findOneAndUpdate({
    filter: { _id: new ObjectId(assignmentId) },
    update: {
      $set: { status: "reviewed", updatedAt: new Date() },
    },
    projection: { _id: 1 },
  });

  const skillKey = (assignment.skill as { key?: string } | undefined)?.key ??
    "composition";
  await applySkillEvidence({
    userId: ownerId,
    skillKey,
    type: "aiReview",
    refId: reviewId,
    score: clamp(
      60 + execution.result.confidence * 40 -
        execution.result.issues.length * 3,
      0,
      100,
    ),
  });

  await createNotification({
    userId: ownerId,
    type: "aiReviewReady",
    title: "Your photo review is ready",
    body: "Open CAMAI to read your photography feedback.",
    dedupeKey: `ai-review-ready:${reviewId}`,
  });
};

const handleNotification = async (lockedJob: LockedJob) => {
  const userId = String(lockedJob.payload.userId ?? "");
  if (!ObjectId.isValid(userId)) throw new Error("Invalid notification user");

  const dedupeKey = String(lockedJob.payload.dedupeKey ?? lockedJob._id);
  await createNotification({
    userId,
    type: String(lockedJob.payload.type ?? "system"),
    title: String(lockedJob.payload.title ?? "CAMAI"),
    body: String(lockedJob.payload.body ?? ""),
    dedupeKey,
  });
};

const handleAccountDeletion = async (lockedJob: LockedJob) => {
  const userId = String(lockedJob.payload.userId ?? "");
  if (!ObjectId.isValid(userId)) throw new Error("Invalid account deletion user");

  const now = new Date();
  await userCollection().updateOne(
    { _id: new ObjectId(userId) },
    { $set: { status: "deleted", updatedAt: now } },
  );
  await sessionCollection().updateMany(
    { "user._id": new ObjectId(userId), revokedAt: { $exists: false } },
    { $set: { revokedAt: now, updatedAt: now } },
  );
  await noteCollection().updateMany(
    { "user._id": new ObjectId(userId), deletedAt: { $exists: false } },
    { $set: { deletedAt: now, updatedAt: now } },
  );
  await fileCollection().updateMany(
    { "owner._id": new ObjectId(userId), deletedAt: { $exists: false } },
    { $set: { deletedAt: now, updatedAt: now } },
  );
};

const handleCleanup = async () => {
  const now = new Date();
  const retention = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  await sessionCollection().deleteMany({ expiresAt: { $lt: now } });
  await sessionCollection().deleteMany({
    revokedAt: { $lt: retention },
  });
  await jobCollection().deleteMany({
    status: "done",
    updatedAt: { $lt: retention },
  });
  await notificationCollection().deleteMany({
    readAt: { $lt: retention },
  });

  const deletedFiles = await fileCollection().find({
    deletedAt: { $lt: retention },
  }).toArray();
  const storage = getStorage();

  for (const storedFile of deletedFiles) {
    try {
      await storage.remove(storedFile);
    } catch {
      // Keep the metadata if object deletion fails so a later cleanup retries.
      continue;
    }
    await fileCollection().deleteOne({ _id: storedFile._id });
  }
};

const handleAnalyticsRollup = () => Promise.resolve();

const handlers: Record<string, (job: LockedJob) => Promise<void>> = {
  aiReview: handleAiReview,
  notification: handleNotification,
  accountDeletion: handleAccountDeletion,
  cleanup: handleCleanup,
  analyticsRollup: handleAnalyticsRollup,
};

export const runJob = async (lockedJob: LockedJob) => {
  const handler = handlers[lockedJob.queue];
  if (!handler) throw new Error(`Unknown job queue: ${lockedJob.queue}`);
  await handler(lockedJob);
};
