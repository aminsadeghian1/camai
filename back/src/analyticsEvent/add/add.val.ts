import { enums, object, optional, size, string } from "lesan";
import { activeRoleMixin } from "@lib";

export const addValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      eventType: size(string(), 1, 100),
      payload: optional(object()),
      sessionId: optional(string()),
      operationId: optional(size(string(), 1, 100)),
    }),
    get: optional(
      object({
        accepted: optional(enums([0, 1])),
      }),
    ),
  });
