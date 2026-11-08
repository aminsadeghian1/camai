import { enums, object, optional, string } from "lesan";
import { emailPattern } from "@model";

export const forgotPasswordValidator = () =>
  object({
    set: object({
      email: emailPattern,
    }),
    get: optional(
      object({
        success: optional(enums([0, 1])),
        resetToken: optional(string()),
      }),
    ),
  });
