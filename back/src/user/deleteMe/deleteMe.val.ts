import { enums, object, optional } from "lesan";
import { activeRoleMixin } from "@lib";

export const deleteMeValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
    }),
    get: object({
      success: optional(enums([0, 1])),
    }),
  });
