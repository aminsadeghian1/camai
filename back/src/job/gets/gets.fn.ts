import { type ActFn } from "lesan";
import { job } from "../../../mod.ts";
import { pageSkip } from "@lib";

export const getsFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const match: Record<string, unknown> = {};

  if (typeof set.queue === "string") match.queue = set.queue;
  if (typeof set.status === "string") match.status = set.status;

  return await job.aggregation({
    pipeline: [
      { $match: match },
      { $sort: { updatedAt: set.sortOrder === "asc" ? 1 : -1 } },
      { $skip: pageSkip(set as { page?: number; limit?: number }) },
      { $limit: Math.min(Math.max(Number(set.limit ?? 50), 1), 200) },
    ],
    projection: get,
  }).toArray();
};
