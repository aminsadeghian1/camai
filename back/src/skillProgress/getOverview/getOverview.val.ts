import { enums, object, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";

const flag = optional(enums([0, 1]));

export const getOverviewValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      userId: optional(string()),
    }),
    get: optional(
      object({
        totalSkills: flag,
        byState: flag,
        averageConfidence: flag,
        topSkills: flag,
        weakSkills: flag,
      }),
    ),
  });
