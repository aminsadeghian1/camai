import { type ActFn, ObjectId } from "lesan";
import { analyticsEvent } from "../../../mod.ts";
import { pageSkip, throwError } from "@lib";

export const getsFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const match: Record<string, unknown> = {};

  if (typeof set.eventType === "string" && set.eventType) {
    match.eventType = set.eventType;
  }
  if (typeof set.userId === "string" && set.userId) {
    if (!ObjectId.isValid(set.userId)) {
      return throwError("VALIDATION_FAILED: Invalid userId");
    }
    match["user._id"] = new ObjectId(set.userId);
  }

  const range: Record<string, Date> = {};
  if (typeof set.since === "string") {
    const since = new Date(set.since);
    if (!Number.isNaN(since.getTime())) range.$gte = since;
  }
  if (typeof set.until === "string") {
    const until = new Date(set.until);
    if (!Number.isNaN(until.getTime())) range.$lte = until;
  }
  if (Object.keys(range).length) match.createdAt = range;

  return await analyticsEvent.aggregation({
    pipeline: [
      { $match: match },
      { $sort: { createdAt: set.sortOrder === "asc" ? 1 : -1 } },
      { $skip: pageSkip(set as { page?: number; limit?: number }) },
      { $limit: Math.min(Math.max(Number(set.limit ?? 50), 1), 200) },
    ],
    projection: get,
  }).toArray();
};
