import { type ActFn, ObjectId } from "lesan";
import { skillProgress } from "../../../mod.ts";
import { getAuth, throwError } from "@lib";

const staffRoles = new Set(["Manager", "Admin"]);

export const getFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user, activeRole } = await getAuth();

  const founded = await skillProgress.findOne({
    filters: { _id: new ObjectId(String(set._id)) },
    projection: { ...(get as Record<string, unknown>), user: { _id: 1 } },
  });

  if (!founded) return throwError("NOT_FOUND: Skill progress not found");

  const ownerId = String(
    (founded.user as { _id?: unknown } | undefined)?._id ?? "",
  );
  if (
    ownerId !== String(user._id) && !staffRoles.has(activeRole.name)
  ) {
    return throwError("FORBIDDEN: You do not own this progress record");
  }

  return await skillProgress.findOne({
    filters: { _id: new ObjectId(String(set._id)) },
    projection: get,
  });
};
