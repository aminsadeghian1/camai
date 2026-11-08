import { enums, object, objectIdValidation, optional } from "lesan";
import { activeRoleMixin } from "@lib";

export const retryValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      _id: objectIdValidation,
    }),
    get: optional(
      object({
        _id: optional(enums([0, 1])),
        status: optional(enums([0, 1])),
      }),
    ),
  });
