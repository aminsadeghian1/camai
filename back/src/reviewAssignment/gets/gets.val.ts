import { object, optional, string } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { review_assignment_status_enums } from "../../../models/reviewAssignment.ts";
import { activeRoleMixin, pagination } from "@lib";

export const getsValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      ...pagination,
      reviewerId: optional(string()),
      assignmentId: optional(string()),
      status: optional(review_assignment_status_enums),
    }),
    get: selectStruct("reviewAssignment", 2),
  });
