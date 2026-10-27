import { object, optional, size, string } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { emailPattern } from "@model";

export const registerValidator = () =>
  object({
    set: object({
      displayName: size(string(), 1, 100),
      email: emailPattern,
      password: size(string(), 8, 100),
      mobile: optional(string()),
    }),
    get: selectStruct("user", 1),
  });
