import { enums, object, optional } from "lesan";
import { activeRoleMixin, pagination } from "@lib";

export const getsValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      ...pagination,
      queue: optional(
        enums([
          "aiReview",
          "notification",
          "analyticsRollup",
          "cleanup",
          "accountDeletion",
        ]),
      ),
      status: optional(
        enums(["queued", "running", "done", "failed", "dead"]),
      ),
    }),
    get: object({
      _id: optional(enums([0, 1])),
      queue: optional(enums([0, 1])),
      payload: optional(enums([0, 1])),
      status: optional(enums([0, 1])),
      attempts: optional(enums([0, 1])),
      maxAttempts: optional(enums([0, 1])),
      runAt: optional(enums([0, 1])),
      lastError: optional(enums([0, 1])),
      idempotencyKey: optional(enums([0, 1])),
      createdAt: optional(enums([0, 1])),
      updatedAt: optional(enums([0, 1])),
    }),
  });
