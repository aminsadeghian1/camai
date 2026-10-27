import { enums, object, optional, string } from "lesan";
import { activeRoleMixin } from "@lib";

export const logoutValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      refreshToken: string(),
    }),
    get: object({
      success: optional(enums([0, 1])),
    }),
  });
