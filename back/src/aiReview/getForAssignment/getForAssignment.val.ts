import { object, objectIdValidation } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { activeRoleMixin } from "@lib";

export const getForAssignmentValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      assignmentId: objectIdValidation,
    }),
    get: selectStruct("aiReview", 2),
  });
