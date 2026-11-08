import { type ActFn, ObjectId } from "lesan";
import { labAttempt, labResult } from "../../../mod.ts";
import { getAuth, pageSkip, throwError } from "@lib";

export const getsFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user, activeRole } = await getAuth();
  const attemptId = new ObjectId(String(set.attemptId));

  const attempt = await labAttempt.findOne({
    filters: { _id: attemptId },
    projection: { _id: 1, user: { _id: 1 } },
  });

  if (!attempt) return throwError("NOT_FOUND: Lab attempt not found");

  const ownerId = String(
    (attempt.user as { _id?: unknown } | undefined)?._id ?? "",
  );
  if (
    ownerId !== String(user._id) &&
    !["Manager", "Admin"].includes(activeRole.name)
  ) {
    return throwError("FORBIDDEN: You do not own this attempt");
  }

  return await labResult.aggregation({
    pipeline: [
      { $match: { "attempt._id": attemptId } },
      { $sort: { createdAt: -1 } },
      { $skip: pageSkip(set as { page?: number; limit?: number }) },
      { $limit: Math.min(Math.max(Number(set.limit ?? 50), 1), 200) },
    ],
    projection: get,
  }).toArray();
};
