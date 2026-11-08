import { number, object, objectIdValidation, optional } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { activeRoleMixin } from "@lib";

export const updateValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      lessonId: objectIdValidation,
      currentBlock: optional(number()),
    }),
    get: selectStruct("lessonProgress", 2),
  });
