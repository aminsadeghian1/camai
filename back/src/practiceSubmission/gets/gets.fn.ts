import { type ActFn, ObjectId } from "lesan";
import { practiceAssignment, practiceSubmission } from "../../../mod.ts";
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

    if (typeof set.assignmentId === "string" && set.assignmentId) {
      if (!ObjectId.isValid(set.assignmentId)) {
        return throwError("VALIDATION_FAILED: Invalid assignmentId");
      }

      const requested = new ObjectId(set.assignmentId);
      if (!assignmentIds.some((id) => id.equals(requested))) {
        return throwError("FORBIDDEN: You are not assigned to this submission");
      }
      match["assignment._id"] = requested;
    } else {
      if (!assignmentIds.length) return [];
      match["assignment._id"] = { $in: assignmentIds };
    }
  } else {
    const scopedUserId = staff
      ? (typeof set.userId === "string" && set.userId ? set.userId : null)
      : String(user._id);

    if (scopedUserId && !ObjectId.isValid(scopedUserId)) {
      return throwError("VALIDATION_FAILED: Invalid userId");
    }

    if (typeof set.assignmentId === "string" && set.assignmentId) {
      if (!ObjectId.isValid(set.assignmentId)) {
        return throwError("VALIDATION_FAILED: Invalid assignmentId");
      }
      match["assignment._id"] = new ObjectId(set.assignmentId);
    }

    if (scopedUserId) {
      const assignments = await practiceAssignment.aggregation({
        pipeline: [{ $match: { "user._id": new ObjectId(scopedUserId) } }],
        projection: { _id: 1 },
      }).toArray();
      const assignmentIds = assignments.map((item) =>
        new ObjectId(String(item._id))
      );

      if (match["assignment._id"]) {
        const requested = String(match["assignment._id"]);
        if (!assignmentIds.some((id) => String(id) === requested)) {
          return throwError("FORBIDDEN: You do not own this submission");
        }
      } else {
        match["assignment._id"] = { $in: assignmentIds };
      }
    }
  }

  if (typeof set.status === "string") match.status = set.status;

  if (typeof set.cursor === "string" && ObjectId.isValid(set.cursor)) {
    match._id = { $lt: new ObjectId(set.cursor) };
  }

  return await practiceSubmission.aggregation({
    pipeline: [
      { $match: match },
      { $sort: { createdAt: -1 } },
      { $skip: pageSkip(set as { page?: number; limit?: number }) },
      { $limit: Math.min(Math.max(Number(set.limit ?? 50), 1), 200) },
    ],
    projection: get,
  }).toArray();
};
