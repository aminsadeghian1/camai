import { boolean, object, optional, string } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { activeRoleMixin } from "@lib";

export const updateSettingsValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      settings: object({
        language: optional(string()),
        notifications: optional(
          object({
            push: optional(boolean()),
            email: optional(boolean()),
          }),
        ),
        privacy: optional(
          object({
            aiProcessingConsent: optional(boolean()),
            analyticsConsent: optional(boolean()),
          }),
        ),
      }),
    }),
    get: selectStruct("user", 2),
  });
