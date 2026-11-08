import { coreApp } from "../../../mod.ts";

const collection = (name: string) => coreApp.odm.getCollection(name);

export const dashboardStatisticFn = async () => {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    activeLearners,
    recentSignups,
    lessonsCompleted,
    practiceSubmissions,
    aiReviewGroups,
    queuedJobs,
    runningJobs,
    deadJobs,
  ] = await Promise.all([
    collection("user").countDocuments({ status: { $ne: "deleted" } }),
    collection("user").countDocuments({
      status: "active",
      "roles.name": "Learner",
    }),
    collection("user").countDocuments({ createdAt: { $gte: since } }),
    collection("lessonProgress").countDocuments({ status: "completed" }),
    collection("practiceSubmission").countDocuments({}),
    collection("aiReview").aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]).toArray(),
    collection("job").countDocuments({ status: "queued" }),
    collection("job").countDocuments({ status: "running" }),
    collection("job").countDocuments({ status: "dead" }),
  ]);

  const reviews: Record<string, number> = {
    queued: 0,
    running: 0,
    valid: 0,
    failed: 0,
  };

  for (const group of aiReviewGroups) {
    reviews[String(group._id)] = Number(group.count ?? 0);
  }

  return {
    totalUsers,
    activeLearners,
    recentSignups,
    lessonsCompleted,
    practiceSubmissions,
    aiReviews: {
      total: Object.values(reviews).reduce((sum, value) => sum + value, 0),
      ...reviews,
    },
    queue: {
      queued: queuedJobs,
      running: runningJobs,
      dead: deadJobs,
    },
    syncFailures: deadJobs,
  };
};
