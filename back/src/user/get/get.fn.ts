import { type ActFn, ObjectId } from "lesan";
import { user } from "../../../mod.ts";
import { sanitizeUserProjection, sanitizeUserResponse, throwError } from "@lib";

export const getFn: ActFn = async (body) => {
  const { set, get } = body.details;

  const founded = await user.findOne({
    filters: { _id: new ObjectId(String(set._id)) },
    projection: sanitizeUserProjection(get),
  });

  if (!founded) return throwError("NOT_FOUND: User not found");

  return sanitizeUserResponse(founded);
};
