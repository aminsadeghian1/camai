import { type ActFn } from "lesan";
import { user } from "../../../mod.ts";
import { pageSkip, sanitizeUserProjection, sanitizeUserResponse } from "@lib";

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const sortable = new Set([
  "createdAt",
  "updatedAt",
  "lastLoginAt",
  "displayName",
  "email",
]);

export const getsFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const match: Record<string, unknown> = {};

  if (typeof set.status === "string") match.status = set.status;
  if (typeof set.role === "string") match["roles.name"] = set.role;

  if (typeof set.search === "string" && set.search.trim()) {
    const expression = new RegExp(escapeRegex(set.search.trim()), "i");
    match.$or = [
      { displayName: expression },
      { email: expression },
      { mobile: expression },
    ];
  }

  if (set.createdAfter || set.createdBefore) {
    match.createdAt = {
      ...(set.createdAfter ? { $gte: set.createdAfter } : {}),
      ...(set.createdBefore ? { $lte: set.createdBefore } : {}),
    };
  }

  const sortBy = typeof set.sortBy === "string" && sortable.has(set.sortBy)
    ? set.sortBy
    : "createdAt";

  const users = await user.aggregation({
    pipeline: [
      { $match: match },
      { $sort: { [sortBy]: set.sortOrder === "asc" ? 1 : -1 } },
      { $skip: pageSkip(set as { page?: number; limit?: number }) },
      { $limit: Math.min(Math.max(Number(set.limit ?? 50), 1), 200) },
    ],
    projection: sanitizeUserProjection(get),
  }).toArray();

  return sanitizeUserResponse(users);
};
