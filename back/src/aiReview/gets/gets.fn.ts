import { type ActFn, ObjectId } from "lesan";
import { aiReview } from "../../../mod.ts";
import { ai_review_status_array } from "../../../models/aiReview.ts";
import { getAuth, isReviewerScoped, pageSkip, throwError } from "@lib";
import {
  activeReviewAssignmentIds,
  submissionIdsForAssignments,
} from "../../../utils/reviewScope.ts";

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getsFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user, activeRole } = await getAuth();
  const match: Record<string, unknown> = {};

  if (
    typeof set.status === "string" &&
    ai_review_status_array.includes(set.status)
  ) {
    match.status = set.status;
  }

  if (typeof set.userId === "string" && set.userId) {
    if (!ObjectId.isValid(set.userId)) {
      return throwError("VALIDATION_FAILED: Invalid userId");
    }
    match["user._id"] = new ObjectId(set.userId);
  }

  if (typeof set.submissionId === "string" && set.submissionId) {
    if (!ObjectId.isValid(set.submissionId)) {
      return throwError("VALIDATION_FAILED: Invalid submissionId");
    }
    match["submission._id"] = new ObjectId(set.submissionId);
  }

  if (typeof set.provider === "string" && set.provider.trim()) {
    match.provider = new RegExp(escapeRegex(set.provider.trim()), "i");
  }

  if (isReviewerScoped(activeRole, user)) {
    const assignmentIds = await activeReviewAssignmentIds(String(user._id));
    const submissionIds = await submissionIdsForAssignments(assignmentIds);

    if (!submissionIds.length) return [];

    if (typeof set.submissionId === "string" && set.submissionId) {
      const requested = new ObjectId(set.submissionId);
      if (!submissionIds.some((id) => id.equals(requested))) return [];
    } else {
      match["submission._id"] = { $in: submissionIds };
    }
  }

  if (typeof set.cursor === "string" && ObjectId.isValid(set.cursor)) {
    match._id = { $lt: new ObjectId(set.cursor) };
  }

  const sortBy = set.sortBy === "updatedAt" ? "updatedAt" : "createdAt";

  return await aiReview.aggregation({
    pipeline: [
      { $match: match },
      { $sort: { [sortBy]: set.sortOrder === "asc" ? 1 : -1 } },
      { $skip: pageSkip(set as { page?: number; limit?: number }) },
      { $limit: Math.min(Math.max(Number(set.limit ?? 50), 1), 200) },
    ],
    projection: get,
  }).toArray();
};
