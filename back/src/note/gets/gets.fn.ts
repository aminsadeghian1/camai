import { type ActFn, ObjectId } from "lesan";
import { note } from "../../../mod.ts";
import { getAuth, pageSkip } from "@lib";

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getsFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user } = await getAuth();
  const match: Record<string, unknown> = {
    "user._id": new ObjectId(String(user._id)),
    deletedAt: { $exists: false },
  };

  if (typeof set.targetType === "string") match.targetType = set.targetType;
  if (typeof set.targetId === "string" && set.targetId) {
    match.targetId = set.targetId;
  }
  if (typeof set.isPinned === "boolean") match.isPinned = set.isPinned;

  if (typeof set.search === "string" && set.search.trim()) {
    match.body = new RegExp(escapeRegex(set.search.trim()), "i");
  }

  if (typeof set.cursor === "string" && ObjectId.isValid(set.cursor)) {
    match._id = { $lt: new ObjectId(set.cursor) };
  }

  return await note.aggregation({
    pipeline: [
      { $match: match },
      { $sort: { isPinned: -1, _id: -1 } },
      { $skip: pageSkip(set as { page?: number; limit?: number }) },
      { $limit: Math.min(Math.max(Number(set.limit ?? 50), 1), 200) },
    ],
    projection: get,
  }).toArray();
};
