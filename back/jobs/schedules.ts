import { coreApp } from "../mod.ts";
import { enqueueJob, idempotencyKey } from "../utils/jobs.ts";

const dayKey = (date = new Date()) => date.toISOString().slice(0, 10);
const hourKey = (date = new Date()) => date.toISOString().slice(0, 13);

const enqueueScheduled = async (
  queue: "cleanup" | "analyticsRollup" | "notificationDispatch",
  key: string,
) =>
  await enqueueJob({
    queue,
    payload: {},
    key: idempotencyKey(queue, key),
    maxAttempts: 3,
  });

let started = false;

export const startSchedules = () => {
  if (started) return;
  started = true;

  Deno.cron("camai-cleanup", "0 3 * * *", async () => {
    await enqueueScheduled("cleanup", dayKey());
  });

  Deno.cron("camai-analytics-rollup", "15 * * * *", async () => {
    await enqueueScheduled("analyticsRollup", hourKey());
  });

  Deno.cron("camai-notification-dispatch", "*/10 * * * *", async () => {
    await enqueueScheduled("notificationDispatch", hourKey());
  });

  Deno.cron("camai-account-deletion", "0 4 * * *", async () => {
    const users = await coreApp.odm.getCollection("user").find({
      status: "suspended",
      deletionRequestedAt: { $exists: true },
    }, { projection: { _id: 1 } }).limit(100).toArray();

    for (const user of users) {
      const userId = String(user._id);
      await enqueueJob({
        queue: "accountDeletion",
        payload: { userId },
        key: idempotencyKey("accountDeletion", userId),
        maxAttempts: 5,
      });
    }
  });
};
