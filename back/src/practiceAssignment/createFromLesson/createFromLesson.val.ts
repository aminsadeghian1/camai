import {
  array,
  date,
  object,
  objectIdValidation,
  optional,
  size,
  string,
} from "lesan";
import { selectStruct } from "../../../mod.ts";
import { activeRoleMixin } from "@lib";

export const createFromLessonValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      lessonId: objectIdValidation,
      skillKey: optional(string()),
      title: optional(size(string(), 1, 200)),
      objective: optional(size(string(), 1, 2000)),
      requiredConcept: optional(string()),
      constraints: optional(array(string())),
      requirements: optional(array(string())),
      sourceLabId: optional(objectIdValidation),
      dueAt: optional(date()),
    }),
    get: selectStruct("practiceAssignment", 2),
  });
