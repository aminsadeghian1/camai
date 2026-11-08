import { object } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { activeRoleMixin } from "@lib";

export const getNextValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
    }),
    get: selectStruct("recommendation", 2),
  });
