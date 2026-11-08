import { object, optional, size, string } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { activeRoleMixin } from "@lib";

export const updateMeValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      displayName: optional(size(string(), 1, 100)),
      mobile: optional(string()),
    }),
    get: selectStruct("user", 2),
  });
