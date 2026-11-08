import { type ActFn, ObjectId } from "lesan";
import { job } from "../../../mod.ts";
import { getAuth, throwError, writeAudit } from "@lib";

export const retryFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const _id = new ObjectId(String(set._id));
  const { user } = await getAuth();

  const existing = await job.findOne({
    filters: { _id },
    projection: { _id: 1, status: 1, queue: 1, attempts: 1 },
  });

  if (!existing) return throwError("NOT_FOUND: Job not found");
  if (!["failed", "dead"].includes(String(existing.status))) {
    return throwError("VALIDATION_FAILED: Only failed or dead jobs can retry");
  }

  const now = new Date();
  const updated = await job.findOneAndUpdate({
    filter: { _id },
    update: {
      $set: {
        status: "queued",
        attempts: 0,
        runAt: now,
        updatedAt: now,
      },
      $unset: { lastError: "", lockedUntil: "" },
    },
    projection: get,
  });

  await writeAudit({
    adminUserId: String(user._id),
    action: "retry",
    targetType: "job",
    targetId: String(_id),
    metadata: { queue: existing.queue, previousStatus: existing.status },
  });

  return updated;
};
