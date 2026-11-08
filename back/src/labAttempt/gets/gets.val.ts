import { boolean, object, optional, string } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { activeRoleMixin, pagination } from "@lib";

export const getsValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      ...pagination,
      userId: optional(string()),
      labId: optional(string()),
      completed: optional(boolean()),
    }),
    get: selectStruct("labAttempt", 2),
  });
