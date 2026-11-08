import { type ActFn, ObjectId } from "lesan";
import {
  aiReview,
  file,
  practiceAssignment,
  practiceSubmission,
} from "../../../mod.ts";
import { enqueueJob, getAuth, throwError } from "@lib";
import { checkAiQuota } from "../../../utils/ai/gateway.ts";
import { PROMPT_VERSION } from "../../../utils/ai/prompts.ts";

export const submitFn: ActFn = async (body) => {
  const { set } = body.details;
  const { user } = await getAuth();
  const userId = new ObjectId(String(user._id));
  const assignmentId = new ObjectId(String(set.assignmentId));

  const existing = await practiceSubmission.findOne({
    filters: {
      "assignment._id": assignmentId,
      operationId: set.operationId,
    },
  });

  if (existing) {
    const review = await aiReview.findOne({
      filters: { "submission._id": new ObjectId(String(existing._id)) },
    });
    return { submission: existing, review };
  }

  const consent = (user as {
    settings?: { privacy?: { aiProcessingConsent?: boolean } };
  }).settings?.privacy?.aiProcessingConsent;

  if (consent !== true) {
    return throwError(
      "FORBIDDEN: AI processing consent is required before submitting practice",
    );
  }

  const assignment = await practiceAssignment.findOne({
    filters: { _id: assignmentId },
    projection: { _id: 1, status: 1, user: { _id: 1 }, skill: { _id: 1 } },
  });

  if (!assignment) return throwError("NOT_FOUND: Assignment not found");

  const ownerId = String(
    (assignment.user as { _id?: unknown } | undefined)?._id ?? "",
  );
  if (ownerId !== String(user._id)) {
    return throwError("FORBIDDEN: You do not own this assignment");
  }

  const media = await file.findOne({
    filters: { _id: new ObjectId(String(set.mediaId)) },
    projection: { _id: 1, status: 1, owner: { _id: 1 } },
  });

  if (!media) return throwError("NOT_FOUND: Media not found");
  if (media.status !== "uploaded") {
    return throwError("VALIDATION_FAILED: Media upload is not complete");
  }
  if (
    String((media.owner as { _id?: unknown } | undefined)?._id) !==
      String(user._id)
  ) {
    return throwError("FORBIDDEN: You do not own this media");
  }

  await checkAiQuota(String(user._id));

  const now = new Date();
  const submission = await practiceSubmission.insertOne({
    doc: {
      status: "submitted",
      operationId: set.operationId,
      ...(set.note ? { note: set.note } : {}),
      ...(set.exif ? { exif: set.exif } : {}),
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
    },
    relations: {
      assignment: { _ids: assignmentId },
      media: { _ids: new ObjectId(String(media._id)) },
    },
  });

  if (!submission) {
    return throwError("VALIDATION_FAILED: Submission could not be created");
  }

  const review = await aiReview.insertOne({
    doc: {
      provider: "pending",
      model: "pending",
      promptVersion: PROMPT_VERSION,
      reviewVersion: "1.0",
      status: "queued",
      attempts: 0,
      createdAt: now,
      updatedAt: now,
    },
    relations: {
      submission: { _ids: new ObjectId(String(submission._id)) },
      user: { _ids: userId },
    },
  });

  if (!review) {
    return throwError("VALIDATION_FAILED: AI review could not be queued");
  }

  await enqueueJob({
    queue: "aiReview",
    payload: { reviewId: String(review._id) },
    key: `aiReview:${String(review._id)}`,
  });

  await practiceAssignment.findOneAndUpdate({
    filter: { _id: assignmentId },
    update: { $set: { status: "submitted", updatedAt: now } },
    projection: { _id: 1 },
  });

  return { submission, review };
};
