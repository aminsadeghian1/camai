import { type ActFn, ObjectId } from "lesan";
import { practiceAssignment } from "../../../mod.ts";
import { getAuth, throwError } from "@lib";
import { hasActiveReviewAssignment } from "../../../utils/reviewScope.ts";

const staffRoles = new Set(["Manager", "Admin"]);

export const getFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user, activeRole } = await getAuth();
  const _id = new ObjectId(String(set._id));

  const founded = await practiceAssignment.findOne({
    filters: { _id },
    projection: { ...(get as Record<string, unknown>), user: { _id: 1 } },
  });

  if (!founded) return throwError("NOT_FOUND: Assignment not found");

  const ownerId = String(
    (founded.user as { _id?: unknown } | undefined)?._id ?? "",
  );

  if (
    ownerId !== String(user._id) && !staffRoles.has(activeRole.name)
  ) {
    const assigned = activeRole.name === "Reviewer" &&
      await hasActiveReviewAssignment(String(user._id), _id);

    if (!assigned) {
      return throwError("FORBIDDEN: You do not own this assignment");
    }
  }

  return founded;
};
