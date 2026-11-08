import { type ActFn, ObjectId } from "lesan";
import { coreApp, user } from "../../../mod.ts";
import {
  getAuth,
  sanitizeUserProjection,
  sanitizeUserResponse,
  throwError,
  writeAudit,
} from "@lib";

const sessions = () => coreApp.odm.getCollection("session");

export const setStatusFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user: actor } = await getAuth();
  const _id = new ObjectId(String(set._id));

  if (String(actor._id) === String(_id)) {
    return throwError("FORBIDDEN: You cannot change your own status");
  }

  const existing = await user.findOne({
    filters: { _id },
    projection: { _id: 1, status: 1 },
  });

  if (!existing) return throwError("NOT_FOUND: User not found");
  if (existing.status === "deleted") {
    return throwError("VALIDATION_FAILED: Deleted accounts cannot be changed");
  }

  const updated = await user.findOneAndUpdate({
    filter: { _id },
    update: {
      $set: { status: set.status, updatedAt: new Date() },
    },
    projection: sanitizeUserProjection(get),
  });

  if (set.status === "suspended") {
    const now = new Date();
    await sessions().updateMany(
      { "user._id": _id, revokedAt: { $exists: false } },
      { $set: { revokedAt: now, updatedAt: now } },
    );
  }

  await writeAudit({
    adminUserId: String(actor._id),
    action: "user.setStatus",
    targetType: "user",
    targetId: String(_id),
    metadata: {
      status: set.status,
      ...(typeof set.reason === "string" ? { reason: set.reason } : {}),
    },
  });

  return sanitizeUserResponse(updated);
};
