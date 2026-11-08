import { enums, number, object, objectIdValidation, optional } from "lesan";
import { activeRoleMixin } from "@lib";

const flag = optional(enums([0, 1]));

export const getSignedUrlValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      _id: objectIdValidation,
      ttlSeconds: optional(number()),
    }),
    get: optional(
      object({
        url: flag,
        expiresIn: flag,
      }),
    ),
  });
