import { enums, number, object, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";

const flag = optional(enums([0, 1]));

export const pullValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      cursor: optional(string()),
      limit: optional(number()),
    }),
    get: optional(
      object({
        cursor: flag,
        notes: flag,
        lessonProgress: flag,
        labAttempts: flag,
        labResults: flag,
        practiceAssignments: flag,
        practiceSubmissions: flag,
        aiReviews: flag,
        notifications: flag,
        recommendations: flag,
        userAchievements: flag,
        learningPaths: flag,
        courses: flag,
        modules: flag,
        lessons: flag,
        labs: flag,
        labScenes: flag,
        labChallenges: flag,
      }),
    ),
  });
