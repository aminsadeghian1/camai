import { date, enums, object, optional, string } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { role_enums, status_enums } from "../../../models/user.ts";
import { activeRoleMixin, pagination } from "@lib";

export const getsValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      ...pagination,
      status: optional(status_enums),
      role: optional(role_enums),
      search: optional(string()),
      createdAfter: optional(date()),
      createdBefore: optional(date()),
      sortBy: optional(string()),
      sortOrder: optional(enums(["asc", "desc"])),
    }),
    get: selectStruct("user", 2),
  });
