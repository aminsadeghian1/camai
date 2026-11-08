import { enums, object, optional, size, string } from "lesan";

export const resetPasswordValidator = () =>
  object({
    set: object({
      token: string(),
      password: size(string(), 8, 100),
    }),
    get: optional(
      object({
        success: optional(enums([0, 1])),
      }),
    ),
  });
