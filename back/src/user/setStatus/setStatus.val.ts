import {
  enums,
  object,
  objectIdValidation,
  optional,
  size,
  string,
} from "lesan";
import { selectStruct } from "../../../mod.ts";
import { activeRoleMixin } from "@lib";

export const setStatusValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      _id: objectIdValidation,
      status: enums(["active", "suspended"]),
      reason: optional(size(string(), 1, 500)),
    }),
    get: selectStruct("user", 2),
  });
