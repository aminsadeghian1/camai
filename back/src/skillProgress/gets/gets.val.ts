import { object, optional, string } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { mastery_state_enums } from "../../../models/skillProgress.ts";
import { activeRoleMixin, pagination } from "@lib";

export const getsValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      ...pagination,
      userId: optional(string()),
      skillId: optional(string()),
      state: optional(mastery_state_enums),
    }),
    get: selectStruct("skillProgress", 2),
  });
