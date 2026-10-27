import { lockNextJob, markJobDone, markJobFailed } from "../utils/jobs.ts";
import { runJob } from "./handlers.ts";

const WORKER_INTERVAL_MS = 5_000;
const MAX_JOBS_PER_TICK = 5;

let running = false;
let started = false;

const tick = async () => {
  if (running) return;
  running = true;

  try {
    for (let index = 0; index < MAX_JOBS_PER_TICK; index++) {
      const lockedJob = await lockNextJob();

      if (!lockedJob) break;

      try {
        await runJob(lockedJob);
        await markJobDone(String(lockedJob._id));
      } catch (error) {
        await markJobFailed(lockedJob, error);
      }
    }
  } catch (error) {
    console.error(
      "[jobs] worker tick failed:",
      error instanceof Error ? error.message : error,
    );
  } finally {
    running = false;
  }
};

export const startJobWorker = () => {
  if (started) return;
  started = true;

  setInterval(() => {
    void tick();
  }, WORKER_INTERVAL_MS);

  void tick();
};
