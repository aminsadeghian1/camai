import { boolean, object, optional, string } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { activeRoleMixin, pagination } from "@lib";

export const getsValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      ...pagination,
      userId: optional(string()),
      unread: optional(boolean()),
    }),
    get: selectStruct("notification", 2),
  });
