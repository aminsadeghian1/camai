import { enums, object, optional, string } from "lesan";
import { activeRoleMixin, pagination } from "@lib";

export const getsValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      ...pagination,
      eventType: optional(string()),
      userId: optional(string()),
      since: optional(string()),
      until: optional(string()),
    }),
    get: object({
      _id: optional(enums([0, 1])),
      eventType: optional(enums([0, 1])),
      payload: optional(enums([0, 1])),
      sessionId: optional(enums([0, 1])),
      createdAt: optional(enums([0, 1])),
      user: optional(object({ _id: optional(enums([0, 1])) })),
    }),
  });
