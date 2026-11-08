import { type ActFn, ObjectId } from "lesan";
import { user } from "../../../mod.ts";
import {
  getAuth,
  sanitizeUserProjection,
  sanitizeUserResponse,
  stripActiveRole,
  throwError,
} from "@lib";

export const updateMeFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user: authenticatedUser } = await getAuth();
  const update = stripActiveRole(set as Record<string, unknown>);

  delete update.updatedAt;
  delete update.createdAt;
  delete update.email;
  delete update.password;
  delete update.roles;
  delete update.status;
  delete update.isGhost;
  delete update.is_verified;

  const fields = Object.entries(update).filter(([, value]) =>
    value !== undefined
  );

  if (!fields.length) {
    return throwError("VALIDATION_FAILED: No profile fields to update");
  }

  const updated = await user.findOneAndUpdate({
    filter: { _id: new ObjectId(String(authenticatedUser._id)) },
    update: {
      $set: {
        ...Object.fromEntries(fields),
        updatedAt: new Date(),
      },
    },
    projection: sanitizeUserProjection(get),
  });

  if (!updated) return throwError("NOT_FOUND: User not found");

  return sanitizeUserResponse(updated);
};
