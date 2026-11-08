import { type ActFn, ObjectId } from "lesan";
import {
  aiReview,
  practiceAssignment,
  practiceSubmission,
} from "../../../mod.ts";
import { getAuth, isReviewScopeBypass, throwError } from "@lib";
import { hasActiveReviewAssignment } from "../../../utils/reviewScope.ts";

export const getForAssignmentFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user, activeRole } = await getAuth();
  const assignmentId = new ObjectId(String(set.assignmentId));

  const assignment = await practiceAssignment.findOne({
    filters: { _id: assignmentId },
    projection: { _id: 1, user: { _id: 1 } },
  });

  if (!assignment) return throwError("NOT_FOUND: Assignment not found");

  const ownerId = String(
    (assignment.user as { _id?: unknown } | undefined)?._id ?? "",
  );

  if (ownerId !== String(user._id)) {
    const bypass = isReviewScopeBypass(activeRole, user);
    const assigned = activeRole.name === "Reviewer" &&
      await hasActiveReviewAssignment(String(user._id), assignmentId);

    if (!bypass && !assigned) {
      return throwError("FORBIDDEN: You do not own this assignment");
    }
  }

  const submissions = await practiceSubmission.aggregation({
    pipeline: [
      { $match: { "assignment._id": assignmentId } },
      { $sort: { submittedAt: -1, _id: -1 } },
      { $limit: 1 },
    ],
    projection: { _id: 1 },
  }).toArray();

  if (!submissions.length) {
    return throwError("NOT_FOUND: No submission for this assignment");
  }

  const submissionId = new ObjectId(String(submissions[0]._id));
  const reviews = await aiReview.aggregation({
    pipeline: [
      { $match: { "submission._id": submissionId } },
      { $sort: { createdAt: -1, _id: -1 } },
      { $limit: 1 },
    ],
    projection: get,
  }).toArray();

  if (!reviews.length) return throwError("NOT_FOUND: AI review not found");

  return reviews[0];
};
