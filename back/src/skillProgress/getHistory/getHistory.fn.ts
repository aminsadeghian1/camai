import { type ActFn, ObjectId } from "lesan";
import { skillProgress } from "../../../mod.ts";
import { getAuth, throwError } from "@lib";

const staffRoles = new Set(["Manager", "Admin"]);

export const getHistoryFn: ActFn = async (body) => {
  const { set } = body.details;
  const { user, activeRole } = await getAuth();
  const staff = staffRoles.has(activeRole.name);
  const scopedUserId = staff && typeof set.userId === "string" && set.userId
    ? set.userId
    : String(user._id);

  if (!ObjectId.isValid(scopedUserId)) {
    return throwError("VALIDATION_FAILED: Invalid userId");
  }

  return await skillProgress.aggregation({
    pipeline: [
      { $match: { "user._id": new ObjectId(scopedUserId) } },
      { $unwind: "$evidence" },
      { $sort: { "evidence.at": -1 } },
      { $limit: Math.min(Math.max(Number(set.limit ?? 50), 1), 200) },
    ],
    projection: {
      state: 1,
      confidence: 1,
      skill: { _id: 1, key: 1, title: 1 },
      evidence: 1,
    },
  }).toArray();
};
