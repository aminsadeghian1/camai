import { type ActFn, ObjectId } from "lesan";
import { practiceAssignment, practiceSubmission } from "../../../mod.ts";
import { getAuth, throwError } from "@lib";
import { hasActiveReviewAssignment } from "../../../utils/reviewScope.ts";

const staffRoles = new Set(["Manager", "Admin"]);

export const getFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user, activeRole } = await getAuth();
  const _id = new ObjectId(String(set._id));

  const internal = await practiceSubmission.findOne({
    filters: { _id },
    projection: { _id: 1, assignment: { _id: 1 } },
  });

  if (!internal) return throwError("NOT_FOUND: Submission not found");

  const assignmentId = String(
    (internal.assignment as { _id?: unknown } | undefined)?._id ?? "",
  );
  const assignment = await practiceAssignment.findOne({
    filters: { _id: new ObjectId(assignmentId) },
    projection: { _id: 1, user: { _id: 1 } },
  });

  if (!assignment) return throwError("NOT_FOUND: Assignment not found");

  const ownerId = String(
    (assignment.user as { _id?: unknown } | undefined)?._id ?? "",
  );

  if (
    ownerId !== String(user._id) && !staffRoles.has(activeRole.name)
  ) {
    const assigned = activeRole.name === "Reviewer" &&
      await hasActiveReviewAssignment(String(user._id), assignmentId);

    if (!assigned) {
      return throwError("FORBIDDEN: You do not own this submission");
    }
  }

  return await practiceSubmission.findOne({
    filters: { _id },
    projection: get,
  });
};
