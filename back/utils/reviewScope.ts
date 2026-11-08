import { ObjectId } from "lesan";
import { practiceSubmission, reviewAssignment } from "../mod.ts";

const relationId = (
  value: unknown,
): ObjectId | null => {
  const raw = (value as { _id?: unknown } | undefined)?._id;
  const id = String(raw ?? "");
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
};

export const hasActiveReviewAssignment = async (
  reviewerId: string,
  assignmentId: string | ObjectId,
): Promise<boolean> => {
  if (
    !ObjectId.isValid(reviewerId) ||
    !ObjectId.isValid(String(assignmentId))
  ) {
    return false;
  }

  const found = await reviewAssignment.findOne({
    filters: {
      "reviewer._id": new ObjectId(reviewerId),
      "assignment._id": new ObjectId(String(assignmentId)),
      status: "active",
    },
    projection: { _id: 1 },
  });

  return Boolean(found);
};

export const activeReviewAssignmentIds = async (
  reviewerId: string,
): Promise<ObjectId[]> => {
  if (!ObjectId.isValid(reviewerId)) return [];

  const rows = await reviewAssignment.aggregation({
    pipeline: [
      {
        $match: {
          "reviewer._id": new ObjectId(reviewerId),
          status: "active",
        },
      },
    ],
    projection: { _id: 1, assignment: { _id: 1 } },
  }).toArray();

  return rows
    .map((row) => relationId(row.assignment))
    .filter((id): id is ObjectId => Boolean(id));
};

export const submissionIdsForAssignments = async (
  assignmentIds: ObjectId[],
): Promise<ObjectId[]> => {
  if (!assignmentIds.length) return [];

  const rows = await practiceSubmission.aggregation({
    pipeline: [
      { $match: { "assignment._id": { $in: assignmentIds } } },
    ],
    projection: { _id: 1 },
  }).toArray();

  return rows.map((row) => new ObjectId(String(row._id)));
};

export const assignmentIdForSubmission = async (
  submissionId: string | ObjectId,
): Promise<ObjectId | null> => {
  if (!ObjectId.isValid(String(submissionId))) return null;

  const found = await practiceSubmission.findOne({
    filters: { _id: new ObjectId(String(submissionId)) },
    projection: { _id: 1, assignment: { _id: 1 } },
  });

  if (!found) return null;

  return relationId(found.assignment);
};

export const reviewerCanAccessSubmission = async (
  reviewerId: string,
  submissionId: string | ObjectId,
): Promise<boolean> => {
  const assignmentId = await assignmentIdForSubmission(submissionId);
  if (!assignmentId) return false;

  return await hasActiveReviewAssignment(reviewerId, assignmentId);
};

export const assignmentIdForFile = async (
  fileId: string | ObjectId,
): Promise<ObjectId | null> => {
  if (!ObjectId.isValid(String(fileId))) return null;

  const rows = await practiceSubmission.aggregation({
    pipeline: [
      { $match: { "media._id": new ObjectId(String(fileId)) } },
      { $limit: 1 },
    ],
    projection: { _id: 1, assignment: { _id: 1 } },
  }).toArray();

  if (!rows.length) return null;

  return relationId(rows[0].assignment);
};

export const reviewerCanAccessFile = async (
  reviewerId: string,
  fileId: string | ObjectId,
): Promise<boolean> => {
  const assignmentId = await assignmentIdForFile(fileId);
  if (!assignmentId) return false;

  return await hasActiveReviewAssignment(reviewerId, assignmentId);
};
