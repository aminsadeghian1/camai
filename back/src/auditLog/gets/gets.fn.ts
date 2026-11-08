import { type ActFn, ObjectId } from "lesan";
import { auditLog } from "../../../mod.ts";
import { pageSkip, throwError } from "@lib";

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getsFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const match: Record<string, unknown> = {};

  for (const field of ["action", "targetType"] as const) {
    const value = set[field];
    if (typeof value === "string" && value.trim()) {
      match[field] = new RegExp(escapeRegex(value.trim()), "i");
    }
  }

  if (typeof set.targetId === "string" && set.targetId) {
    match.targetId = set.targetId;
  }

  if (typeof set.adminUserId === "string" && set.adminUserId) {
    if (!ObjectId.isValid(set.adminUserId)) {
      return throwError("VALIDATION_FAILED: Invalid adminUserId");
    }
    match["adminUser._id"] = new ObjectId(set.adminUserId);
  }

  if (typeof set.cursor === "string" && ObjectId.isValid(set.cursor)) {
    match._id = { $lt: new ObjectId(set.cursor) };
  }

  return await auditLog.aggregation({
    pipeline: [
      { $match: match },
      { $sort: { createdAt: set.sortOrder === "asc" ? 1 : -1 } },
      { $skip: pageSkip(set as { page?: number; limit?: number }) },
      { $limit: Math.min(Math.max(Number(set.limit ?? 50), 1), 200) },
    ],
    projection: get,
  }).toArray();
};
