import { type ActFn, ObjectId } from "lesan";
import { reviewAssignment } from "../../../mod.ts";
import { getAuth, throwError, writeAudit } from "@lib";

export const revokeFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user: actor } = await getAuth();
  const _id = new ObjectId(String(set._id));

  const existing = await reviewAssignment.findOne({
    filters: { _id },
    projection: { _id: 1, status: 1 },
  });

  if (!existing) return throwError("NOT_FOUND: Review assignment not found");

  if (existing.status === "revoked") {
    return await reviewAssignment.findOne({
      filters: { _id },
      projection: get,
    });
  }

  const now = new Date();
  await reviewAssignment.findOneAndUpdate({
    filter: { _id },
    update: {
      $set: { status: "revoked", revokedAt: now, updatedAt: now },
    },
    projection: { _id: 1 },
  });

  await reviewAssignment.addRelation({
    filters: { _id },
    relations: {
      revokedBy: { _ids: [new ObjectId(String(actor._id))] },
    },
  });

  const revoked = await reviewAssignment.findOne({
    filters: { _id },
    projection: get,
  });

  await writeAudit({
    adminUserId: String(actor._id),
    action: "reviewAssignment.revoke",
    targetType: "reviewAssignment",
    targetId: String(_id),
  });

  return revoked;
};
