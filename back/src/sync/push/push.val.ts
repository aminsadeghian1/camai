import { array, object, optional, size, string } from "lesan";
import { activeRoleMixin } from "@lib";

export const pushValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      operations: array(
        object({
          operationId: size(string(), 1, 100),
          entityType: size(string(), 1, 40),
          op: size(string(), 1, 40),
          payload: optional(object()),
          clientTimestamp: optional(string()),
        }),
      ),
    }),
    get: optional(
      object({
        results: optional(array(object({}))),
      }),
    ),
  });
