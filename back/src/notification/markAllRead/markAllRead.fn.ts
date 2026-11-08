import { type ActFn, ObjectId } from "lesan";
import { coreApp } from "../../../mod.ts";
import { getAuth } from "@lib";

export const markAllReadFn: ActFn = async () => {
  const { user } = await getAuth();
  const now = new Date();
  const result = await coreApp.odm.getCollection("notification").updateMany(
    {
      "user._id": new ObjectId(String(user._id)),
      readAt: { $exists: false },
    },
    { $set: { readAt: now, updatedAt: now } },
  );

  return { updated: Number(result.modifiedCount ?? 0) };
};
