import { type ActFn, ObjectId } from "lesan";
import { skillProgress } from "../../../mod.ts";
import { getAuth, throwError } from "@lib";

const staffRoles = new Set(["Manager", "Admin"]);

export const getOverviewFn: ActFn = async (body) => {
  const { set } = body.details;
  const { user, activeRole } = await getAuth();
  const staff = staffRoles.has(activeRole.name);
  const scopedUserId = staff && typeof set.userId === "string" && set.userId
    ? set.userId
    : String(user._id);

  if (!ObjectId.isValid(scopedUserId)) {
    return throwError("VALIDATION_FAILED: Invalid userId");
  }

  const userId = new ObjectId(scopedUserId);
  const [stateGroups, topSkills, weakSkills] = await Promise.all([
    skillProgress.aggregation({
      pipeline: [
        { $match: { "user._id": userId } },
        {
          $group: {
            _id: "$state",
            count: { $sum: 1 },
            averageConfidence: { $avg: "$confidence" },
          },
        },
      ],
    }).toArray(),
    skillProgress.aggregation({
      pipeline: [
        { $match: { "user._id": userId } },
        { $sort: { confidence: -1 } },
        { $limit: 5 },
      ],
      projection: {
        state: 1,
        confidence: 1,
        skill: { _id: 1, key: 1, title: 1 },
      },
    }).toArray(),
    skillProgress.aggregation({
      pipeline: [
        {
          $match: {
            "user._id": userId,
            state: { $nin: ["unseen", "mastered"] },
          },
        },
        { $sort: { confidence: 1 } },
        { $limit: 5 },
      ],
      projection: {
        state: 1,
        confidence: 1,
        skill: { _id: 1, key: 1, title: 1 },
      },
    }).toArray(),
  ]);

  const byState: Record<string, number> = {};
  let totalSkills = 0;
  let confidenceTotal = 0;

  for (const group of stateGroups) {
    const count = Number(group.count ?? 0);
    byState[String(group._id)] = count;
    totalSkills += count;
    confidenceTotal += Number(group.averageConfidence ?? 0) * count;
  }

  return {
    totalSkills,
    byState,
    averageConfidence: totalSkills
      ? Math.round((confidenceTotal / totalSkills) * 100) / 100
      : 0,
    topSkills,
    weakSkills,
  };
};
