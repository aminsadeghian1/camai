import { enums, object, optional } from "lesan";
import { activeRoleMixin } from "@lib";

export const markAllReadValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
    }),
    get: optional(object({ updated: optional(enums([0, 1])) })),
  });
