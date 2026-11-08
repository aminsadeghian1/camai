import { type ActFn, ObjectId } from "lesan";
import { aiReview } from "../../../mod.ts";
import {
  enqueueJob,
  getAuth,
  isReviewScopeBypass,
  throwError,
  writeAudit,
} from "@lib";
import {
  assignmentIdForSubmission,
  hasActiveReviewAssignment,
} from "../../../utils/reviewScope.ts";

export const retryFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user: actor, activeRole } = await getAuth();
  const _id = new ObjectId(String(set._id));

  const existing = await aiReview.findOne({
    filters: { _id },
    projection: {
      _id: 1,
      status: 1,
      user: { _id: 1 },
      submission: { _id: 1 },
    },
  });

  if (!existing) return throwError("NOT_FOUND: AI review not found");

  if (!isReviewScopeBypass(activeRole, actor)) {
    const submissionId = (existing.submission as { _id?: unknown } | undefined)
      ?._id;
    const assignmentId = await assignmentIdForSubmission(String(submissionId));
    const assigned = assignmentId !== null &&
      await hasActiveReviewAssignment(String(actor._id), assignmentId);

    if (activeRole.name !== "Reviewer" || !assigned) {
      return throwError("FORBIDDEN: You are not assigned to this review");
    }
  }
  if (existing.status === "valid") {
    return throwError("VALIDATION_FAILED: AI review is already valid");
  }
  if (existing.status === "queued" || existing.status === "running") {
    return throwError("VALIDATION_FAILED: AI review is already in progress");
  }

  const review = await aiReview.findOneAndUpdate({
    filter: { _id },
    update: {
      $set: { status: "queued", updatedAt: new Date() },
      $unset: { errorDiagnostics: "" },
    },
    projection: get,
  });

  await enqueueJob({
    queue: "aiReview",
    payload: { reviewId: String(_id) },
    key: `aiReview:retry:${String(_id)}:${Date.now()}`,
  });

  await writeAudit({
    adminUserId: String(actor._id),
    action: "aiReview.retry",
    targetType: "aiReview",
    targetId: String(_id),
    metadata: {
      ownerId: String((existing.user as { _id?: unknown } | undefined)?._id),
    },
  });

  return review;
};
