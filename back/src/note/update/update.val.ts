import {
  boolean,
  object,
  objectIdValidation,
  optional,
  size,
  string,
} from "lesan";
import { selectStruct } from "../../../mod.ts";
import { activeRoleMixin } from "@lib";

export const updateValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      _id: objectIdValidation,
      body: optional(size(string(), 1, 10000)),
      isPinned: optional(boolean()),
    }),
    get: selectStruct("note", 2),
  });
