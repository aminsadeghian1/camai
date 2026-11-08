import { type ActFn, ObjectId } from "lesan";
import { labAttempt } from "../../../mod.ts";
import { getAuth, throwError } from "@lib";

export const canReadLibraryRecord = async (
  doc: { user?: { _id?: unknown } } | null,
) => {
  if (!doc) return throwError("NOT_FOUND: Record not found");
  const { user, activeRole } = await getAuth();
  const ownerId = String(doc.user?._id ?? "");

  if (
    ownerId !== String(user._id) &&
    !["Manager", "Admin"].includes(activeRole.name)
  ) {
    return throwError("FORBIDDEN: You do not own this record");
  }
};

export const getFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const founded = await labAttempt.findOne({
    filters: { _id: new ObjectId(String(set._id)) },
    projection: { ...(get as Record<string, unknown>), user: { _id: 1 } },
  });

  await canReadLibraryRecord(founded);
  return await labAttempt.findOne({
    filters: { _id: new ObjectId(String(set._id)) },
    projection: get,
  });
};
