import { type ActFn, ObjectId } from "lesan";
import { reviewAssignment } from "../../../mod.ts";
import { review_assignment_status_array } from "../../../models/reviewAssignment.ts";
import {
  canManageReviewAssignments,
  getAuth,
  isReviewerScoped,
  pageSkip,
  throwError,
} from "@lib";

export const getsFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user, activeRole } = await getAuth();
  const match: Record<string, unknown> = {};

  if (isReviewerScoped(activeRole, user)) {
    match["reviewer._id"] = new ObjectId(String(user._id));

    if (
      typeof set.reviewerId === "string" && set.reviewerId &&
      set.reviewerId !== String(user._id)
    ) {
      return [];
    }
  } else if (canManageReviewAssignments(activeRole)) {
    if (typeof set.reviewerId === "string" && set.reviewerId) {
      if (!ObjectId.isValid(set.reviewerId)) {
        return throwError("VALIDATION_FAILED: Invalid reviewerId");
      }
      match["reviewer._id"] = new ObjectId(set.reviewerId);
    }
  } else {
    return throwError("FORBIDDEN: You cannot list review assignments");
  }

  if (typeof set.assignmentId === "string" && set.assignmentId) {
    if (!ObjectId.isValid(set.assignmentId)) {
      return throwError("VALIDATION_FAILED: Invalid assignmentId");
    }
    match["assignment._id"] = new ObjectId(set.assignmentId);
  }

  if (
    typeof set.status === "string" &&
    review_assignment_status_array.includes(set.status)
  ) {
    match.status = set.status;
  }

  if (typeof set.cursor === "string" && ObjectId.isValid(set.cursor)) {
    match._id = { $lt: new ObjectId(set.cursor) };
  }

  return await reviewAssignment.aggregation({
    pipeline: [
      { $match: match },
      { $sort: { createdAt: -1, _id: -1 } },
      { $skip: pageSkip(set as { page?: number; limit?: number }) },
      { $limit: Math.min(Math.max(Number(set.limit ?? 50), 1), 200) },
    ],
    projection: get,
  }).toArray();
};
