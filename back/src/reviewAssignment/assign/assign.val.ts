import { object, objectIdValidation } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { activeRoleMixin } from "@lib";

export const assignValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      assignmentId: objectIdValidation,
      reviewerId: objectIdValidation,
    }),
    get: selectStruct("reviewAssignment", 2),
  });
