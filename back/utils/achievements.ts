import { ObjectId } from "lesan";
import { achievement, coreApp, userAchievement } from "../mod.ts";
import { throwError } from "./throwError.ts";

type AchievementDefinition = {
  type?: string;
  threshold?: number;
  skillKey?: string;
};

const collection = (name: string) => coreApp.odm.getCollection(name);

const countFor = async (
  type: string,
  userId: ObjectId,
  skillKey?: string,
): Promise<number> => {
  if (type === "labCount") {
    return await collection("labAttempt").countDocuments({
      "user._id": userId,
      completedAt: { $exists: true },
    });
  }

  if (type === "challengeCount") {
    return await collection("labAttempt").countDocuments({
      "user._id": userId,
      challengeResult: { $exists: true },
    });
  }

  if (type === "lessonCount") {
    return await collection("lessonProgress").countDocuments({
      "user._id": userId,
      status: "completed",
    });
  }

  if (type === "practiceCount") {
    const assignments = await collection("practiceAssignment").find({
      "user._id": userId,
    }, { projection: { _id: 1 } }).toArray();
    const ids = assignments.map((item) => item._id);
    if (!ids.length) return 0;
    return await collection("practiceSubmission").countDocuments({
      "assignment._id": { $in: ids },
    });
  }

  if (type === "skillMastered" || type === "skillCount") {
    const filter: Record<string, unknown> = { "user._id": userId };
    if (skillKey) {
      const foundedSkill = await collection("skill").findOne({ key: skillKey });
      if (!foundedSkill) return 0;
      filter["skill._id"] = foundedSkill._id;
    }
    if (type === "skillMastered") filter.state = "mastered";
    return await collection("skillProgress").countDocuments(filter);
  }

  return 0;
};

export const evaluateAchievements = async (
  userId: string,
): Promise<unknown[]> => {
  if (!ObjectId.isValid(userId)) {
    throwError("VALIDATION_FAILED: Invalid achievement user");
  }

  const userObjectId = new ObjectId(userId);
  const achievements = await achievement.aggregation({
    pipeline: [],
    projection: { _id: 1, key: 1, title: 1, definition: 1 },
  }).toArray();

  const awarded: unknown[] = [];
  const cache = new Map<string, number>();

  for (const item of achievements) {
    const definition = (item.definition ?? {}) as AchievementDefinition;
    const type = String(definition.type ?? "");
    const threshold = Number(definition.threshold ?? 0);
    if (!type || !Number.isFinite(threshold) || threshold <= 0) continue;

    const achievementId = new ObjectId(String(item._id));
    const existing = await userAchievement.findOne({
      filters: {
        "user._id": userObjectId,
        "achievement._id": achievementId,
      },
      projection: { _id: 1 },
    });

    if (existing) continue;

    const cacheKey = `${type}:${definition.skillKey ?? ""}`;
    const current = cache.get(cacheKey) ??
      await countFor(type, userObjectId, definition.skillKey);
    cache.set(cacheKey, current);

    if (current < threshold) continue;

    const now = new Date();
    try {
      const created = await userAchievement.insertOne({
        doc: { awardedAt: now, createdAt: now, updatedAt: now },
        relations: {
          user: { _ids: userObjectId },
          achievement: { _ids: achievementId },
        },
      });
      if (created) awarded.push(created);
    } catch {
      // Unique user/achievement index guarantees a single award.
    }
  }

  return awarded;
};
