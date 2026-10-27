import { enums, object, optional, string } from "lesan";
import { selectStruct } from "../../../mod.ts";

export const refreshValidator = () =>
  object({
    set: object({
      refreshToken: string(),
      device: optional(string()),
    }),
    get: optional(
      object({
        token: optional(enums([0, 1])),
        refreshToken: optional(enums([0, 1])),
        user: selectStruct("user", 1),
      }),
    ),
  });
