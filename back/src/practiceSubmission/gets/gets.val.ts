import { object, optional, string } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { submission_status_enums } from "../../../models/practiceSubmission.ts";
import { activeRoleMixin, pagination } from "@lib";

export const getsValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      ...pagination,
      userId: optional(string()),
      assignmentId: optional(string()),
      status: optional(submission_status_enums),
    }),
    get: selectStruct("practiceSubmission", 2),
  });
