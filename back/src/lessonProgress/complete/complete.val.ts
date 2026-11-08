import { object, objectIdValidation } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { activeRoleMixin } from "@lib";

export const completeValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      lessonId: objectIdValidation,
    }),
    get: selectStruct("lessonProgress", 2),
  });
