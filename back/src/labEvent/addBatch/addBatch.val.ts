import {
  array,
  enums,
  object,
  objectIdValidation,
  optional,
  size,
  string,
} from "lesan";
import { activeRoleMixin } from "@lib";

export const addBatchValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      attemptId: objectIdValidation,
      events: array(
        object({
          operationId: size(string(), 1, 100),
          eventType: string(),
          payload: optional(object()),
        }),
      ),
    }),
    get: optional(object({ accepted: optional(enums([0, 1])) })),
  });
