import { enums, object, optional } from "lesan";
import { activeRoleMixin } from "@lib";

const flag = optional(enums([0, 1]));
const flagGroup = optional(
  object({
    total: flag,
    queued: flag,
    running: flag,
    valid: flag,
    failed: flag,
    dead: flag,
  }),
);

export const dashboardStatisticValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
    }),
    get: optional(
      object({
        totalUsers: flag,
        activeLearners: flag,
        recentSignups: flag,
        lessonsCompleted: flag,
        practiceSubmissions: flag,
        aiReviews: flagGroup,
        queue: flagGroup,
        syncFailures: flag,
      }),
    ),
  });
