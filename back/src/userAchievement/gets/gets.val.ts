import { object, optional, string } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { activeRoleMixin, pagination } from "@lib";

export const getsValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      ...pagination,
      userId: optional(string()),
    }),
    get: selectStruct("userAchievement", 2),
  });
