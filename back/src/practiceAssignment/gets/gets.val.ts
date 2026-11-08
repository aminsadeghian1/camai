import { enums, object, optional, string } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { practice_status_enums } from "../../../models/practiceAssignment.ts";
import { activeRoleMixin, pagination } from "@lib";

export const getsValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      ...pagination,
      userId: optional(string()),
      lessonId: optional(string()),
      status: optional(practice_status_enums),
      sortOrder: optional(enums(["asc", "desc"])),
    }),
    get: selectStruct("practiceAssignment", 2),
  });
