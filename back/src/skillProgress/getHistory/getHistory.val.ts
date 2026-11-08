import { number, object, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";

export const getHistoryValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      userId: optional(string()),
      limit: optional(number()),
    }),
    get: optional(object()),
  });
