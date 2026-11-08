import { type ActFn, ObjectId } from "lesan";
import { notification } from "../../../mod.ts";
import { getAuth, pageSkip, throwError } from "@lib";

const staffRoles = new Set(["Manager", "Admin"]);

export const getsFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user, activeRole } = await getAuth();
  const staff = staffRoles.has(activeRole.name);
  const scopedUserId = staff && typeof set.userId === "string" && set.userId
    ? set.userId
    : String(user._id);

  if (!ObjectId.isValid(scopedUserId)) {
    return throwError("VALIDATION_FAILED: Invalid userId");
  }

  const match: Record<string, unknown> = {
    "user._id": new ObjectId(scopedUserId),
  };

  if (set.unread === true) match.readAt = { $exists: false };
  if (set.unread === false) match.readAt = { $exists: true };

  if (typeof set.cursor === "string" && ObjectId.isValid(set.cursor)) {
    match._id = { $lt: new ObjectId(set.cursor) };
  }

  return await notification.aggregation({
    pipeline: [
      { $match: match },
      { $sort: { createdAt: -1, _id: -1 } },
      { $skip: pageSkip(set as { page?: number; limit?: number }) },
      { $limit: Math.min(Math.max(Number(set.limit ?? 50), 1), 200) },
    ],
    projection: get,
  }).toArray();
};
