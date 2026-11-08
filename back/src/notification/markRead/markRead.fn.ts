import { type ActFn, ObjectId } from "lesan";
import { notification } from "../../../mod.ts";
import { getAuth, throwError } from "@lib";

export const markReadFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user } = await getAuth();
  const _id = new ObjectId(String(set._id));

  const existing = await notification.findOne({
    filters: { _id },
    projection: { _id: 1, user: { _id: 1 } },
  });

  if (!existing) return throwError("NOT_FOUND: Notification not found");

  const ownerId = String(
    (existing.user as { _id?: unknown } | undefined)?._id ?? "",
  );
  if (ownerId !== String(user._id)) {
    return throwError("FORBIDDEN: You do not own this notification");
  }

  return await notification.findOneAndUpdate({
    filter: { _id },
    update: { $set: { readAt: new Date(), updatedAt: new Date() } },
    projection: get,
  });
};
