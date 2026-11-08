import { type ActFn, ObjectId } from "lesan";
import { labAttempt } from "../../../mod.ts";
import { getAuth, pageSkip, throwError } from "@lib";

const staffRoles = new Set(["Manager", "Admin"]);

export const getsFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user, activeRole } = await getAuth();
  const match: Record<string, unknown> = {};

  if (
    typeof set.userId === "string" && set.userId &&
    staffRoles.has(activeRole.name)
  ) {
    if (!ObjectId.isValid(set.userId)) {
      return throwError("VALIDATION_FAILED: Invalid userId");
    }
    match["user._id"] = new ObjectId(set.userId);
  } else {
    match["user._id"] = new ObjectId(String(user._id));
  }

  if (typeof set.labId === "string" && set.labId) {
    if (!ObjectId.isValid(set.labId)) {
      return throwError("VALIDATION_FAILED: Invalid labId");
    }
    match["lab._id"] = new ObjectId(set.labId);
  }

  if (set.completed === true) match.completedAt = { $exists: true };
  if (set.completed === false) match.completedAt = { $exists: false };

  if (typeof set.cursor === "string" && ObjectId.isValid(set.cursor)) {
    match._id = { $lt: new ObjectId(set.cursor) };
  }

  return await labAttempt.aggregation({
    pipeline: [
      { $match: match },
      { $sort: { createdAt: -1 } },
      { $skip: pageSkip(set as { page?: number; limit?: number }) },
      { $limit: Math.min(Math.max(Number(set.limit ?? 50), 1), 200) },
    ],
    projection: get,
  }).toArray();
};
