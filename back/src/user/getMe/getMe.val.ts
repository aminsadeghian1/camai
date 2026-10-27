import { object } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { activeRoleMixin } from "@lib";

export const getMeValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
    }),
    get: selectStruct("user", 2),
  });
