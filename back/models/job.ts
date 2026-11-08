import { coreApp } from "../mod.ts";
import {
  date,
  defaulted,
  enums,
  number,
  object,
  optional,
  string,
} from "lesan";
import { createUpdateAt } from "./utils/createUpdateAt.ts";

export const job_queue_array = [
  "aiReview",
  "notification",
  "notificationDispatch",
  "analyticsRollup",
  "cleanup",
  "accountDeletion",
];

export const job_queue_enums = enums(job_queue_array);

export const job_status_array = [
  "queued",
  "running",
  "done",
  "failed",
  "dead",
];

export const job_status_enums = enums(job_status_array);

export const job_pure = {
  queue: job_queue_enums,
  payload: object(),
  status: defaulted(job_status_enums, "queued"),
  attempts: defaulted(number(), 0),
  maxAttempts: defaulted(number(), 5),
  runAt: defaulted(date(), () => new Date()),
  lockedUntil: optional(date()),
  lastError: optional(string()),
  idempotencyKey: string(),
  ...createUpdateAt,
};

export const job_relations = {};

export const jobs = () =>
  coreApp.odm.newModel("job", job_pure, job_relations, {
    createIndex: {
      indexSpec: { idempotencyKey: 1 },
      options: { unique: true },
    },
  });
