import { ObjectId } from "lesan";
import { coreApp, job } from "../mod.ts";

export type JobQueue =
  | "aiReview"
  | "notification"
  | "analyticsRollup"
  | "cleanup"
  | "accountDeletion";

export const idempotencyKey = (...parts: string[]) => parts.join(":");

export const enqueueJob = async ({
  queue,
  payload,
  key,
  runAt = new Date(),
  maxAttempts = 5,
}: {
  queue: JobQueue;
  payload: Record<string, unknown>;
  key: string;
  runAt?: Date;
  maxAttempts?: number;
}) => {
  try {
    return await job.insertOne({
      doc: {
        queue,
        payload,
        status: "queued",
        attempts: 0,
        maxAttempts,
        runAt,
        idempotencyKey: key,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  } catch {
    return await job.findOne({ filters: { idempotencyKey: key } });
  }
};

const jobCollection = () => coreApp.odm.getCollection("job");

export const lockNextJob = async (lockSeconds = 300) => {
  const now = new Date();
  const lockedUntil = new Date(now.getTime() + lockSeconds * 1000);
  const result = await jobCollection().findOneAndUpdate(
    {
      status: "queued",
      runAt: { $lte: now },
    },
    {
      $set: { status: "running", lockedUntil, updatedAt: now },
      $inc: { attempts: 1 },
    },
    { returnDocument: "after" },
  );
  return result ?? null;
};

export const markJobDone = async (jobId: string) => {
  await jobCollection().updateOne(
    { _id: new ObjectId(jobId) },
    {
      $set: {
        status: "done",
        lockedUntil: null,
        lastError: null,
        updatedAt: new Date(),
      },
    },
  );
};

export const markJobFailed = async (
  lockedJob: {
    _id: unknown;
    attempts?: number;
    maxAttempts?: number;
  },
  error: unknown,
) => {
  const attempts = Number(lockedJob.attempts ?? 1);
  const maxAttempts = Number(lockedJob.maxAttempts ?? 5);
  const dead = attempts >= maxAttempts;
  const backoffMs = Math.min(2 ** attempts * 30_000, 60 * 60 * 1000);
  const message = error instanceof Error ? error.message : String(error);

  await jobCollection().updateOne(
    { _id: new ObjectId(String(lockedJob._id)) },
    {
      $set: {
        status: dead ? "dead" : "queued",
        lastError: message.slice(0, 2000),
        lockedUntil: null,
        runAt: new Date(Date.now() + backoffMs),
        updatedAt: new Date(),
      },
    },
  );
};
