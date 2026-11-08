import type { ActFn } from "lesan";
import { ObjectId } from "lesan";
import { coreApp, user } from "../../../mod.ts";
import { getAuth, throwError } from "@lib";
import { enqueueJob, idempotencyKey } from "@lib";

export const deleteMeFn: ActFn = async (_body) => {
  const { user: authenticatedUser } = await getAuth();
  const userId = String(authenticatedUser._id);

  if (!ObjectId.isValid(userId)) {
    return throwError("UNAUTHORIZED: Invalid user");
  }

  const now = new Date();

  await user.findOneAndUpdate({
    filter: { _id: new ObjectId(userId) },
    update: {
      $set: {
        status: "suspended",
        deletionRequestedAt: now,
        updatedAt: now,
      },
    },
    projection: { _id: 1 },
  });

  await coreApp.odm.getCollection("session").updateMany(
    { "user._id": new ObjectId(userId), revokedAt: { $exists: false } },
    { $set: { revokedAt: now, updatedAt: now } },
  );

  await enqueueJob({
    queue: "accountDeletion",
    payload: { userId },
    key: idempotencyKey("accountDeletion", userId),
    runAt: now,
  });

  return { success: 1 as const };
};
