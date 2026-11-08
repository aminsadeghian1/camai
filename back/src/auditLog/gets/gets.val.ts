import { enums, object, optional, string } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { activeRoleMixin, pagination } from "@lib";

export const getsValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      ...pagination,
      action: optional(string()),
      targetType: optional(string()),
      targetId: optional(string()),
      adminUserId: optional(string()),
      sortOrder: optional(enums(["asc", "desc"])),
    }),
    get: selectStruct("auditLog", 2),
  });
