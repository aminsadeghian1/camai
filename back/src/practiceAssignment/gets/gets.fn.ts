import { type ActFn, ObjectId } from "lesan";
import { practiceAssignment } from "../../../mod.ts";
import { getAuth, pageSkip, throwError } from "@lib";
import { activeReviewAssignmentIds } from "../../../utils/reviewScope.ts";

const staffRoles = new Set(["Manager", "Admin"]);

export const getsFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user, activeRole } = await getAuth();
  const match: Record<string, unknown> = {};
  const staff = staffRoles.has(activeRole.name);

  if (!staff && activeRole.name === "Reviewer") {
    const assignmentIds = await activeReviewAssignmentIds(String(user._id));

    if (!assignmentIds.length) return [];
    match._id = { $in: assignmentIds };
  } else if (typeof set.userId === "string" && set.userId && staff) {
    if (!ObjectId.isValid(set.userId)) {
      return throwError("VALIDATION_FAILED: Invalid userId");
    }
    match["user._id"] = new ObjectId(set.userId);
  } else {
    match["user._id"] = new ObjectId(String(user._id));
  }

  if (typeof set.status === "string") match.status = set.status;
  if (typeof set.lessonId === "string" && set.lessonId) {
    if (!ObjectId.isValid(set.lessonId)) {
      return throwError("VALIDATION_FAILED: Invalid lessonId");
    }
    match["lesson._id"] = new ObjectId(set.lessonId);
  }

  if (typeof set.cursor === "string" && ObjectId.isValid(set.cursor)) {
    const cursorFilter = { $lt: new ObjectId(set.cursor) };
    match._id = match._id
      ? { ...(match._id as Record<string, unknown>), ...cursorFilter }
      : cursorFilter;
  }

  return await practiceAssignment.aggregation({
    pipeline: [
      { $match: match },
      { $sort: { createdAt: -1 } },
      { $skip: pageSkip(set as { page?: number; limit?: number }) },
      { $limit: Math.min(Math.max(Number(set.limit ?? 50), 1), 200) },
    ],
    projection: get,
  }).toArray();
};
