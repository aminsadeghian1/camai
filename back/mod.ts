import { lesan, MongoClient } from "lesan";
import {
  achievements,
  aiReviews,
  analyticsEvents,
  auditLogs,
  courses,
  createIndexes,
  files,
  jobs,
  labAttempts,
  labChallenges,
  labEvents,
  labResults,
  labs,
  labScenes,
  learningPaths,
  lessonProgresses,
  lessons,
  modules,
  notes,
  notifications,
  practiceAssignments,
  practiceSubmissions,
  recommendations,
  reviewAssignments,
  sessions,
  skillProgresses,
  skills,
  userAchievements,
  users,
} from "@model";
import { functionsSetup } from "./src/mod.ts";
import { startJobWorker } from "./jobs/worker.ts";
import { startSchedules } from "./jobs/schedules.ts";
import { startMediaServer } from "./http/mediaServer.ts";

const MONGO_URI = Deno.env.get("MONGO_URI") || "mongodb://127.0.0.1:27017/";
const MONGO_DB = Deno.env.get("MONGO_DB") || "camai";
const APP_PORT = Deno.env.get("APP_PORT") || "1405";
const ENV = Deno.env.get("ENV") || "development";

export const coreApp = lesan();
const client = await new MongoClient(MONGO_URI).connect();
export const db = client.db(MONGO_DB);
coreApp.odm.setDb(db);

export const user = users();
export const file = files();
export const session = sessions();
export const skill = skills();
export const achievement = achievements();
export const learningPath = learningPaths();
export const course = courses();
export const module = modules();
export const lesson = lessons();
export const labScene = labScenes();
export const lab = labs();
export const labChallenge = labChallenges();
export const lessonProgress = lessonProgresses();
export const labAttempt = labAttempts();
export const labEvent = labEvents();
export const labResult = labResults();
export const practiceAssignment = practiceAssignments();
export const practiceSubmission = practiceSubmissions();
export const reviewAssignment = reviewAssignments();
export const note = notes();
export const aiReview = aiReviews();
export const job = jobs();
export const skillProgress = skillProgresses();
export const recommendation = recommendations();
export const userAchievement = userAchievements();
export const analyticsEvent = analyticsEvents();
export const auditLog = auditLogs();
export const notification = notifications();

export const { setAct, setService, getAtcsWithServices } = coreApp.acts;

export const { selectStruct, getSchemas } = coreApp.schemas;

functionsSetup();

await createIndexes();

startJobWorker();
startSchedules();

if ((Deno.env.get("STORAGE_DRIVER") || "local").toLowerCase() === "local") {
  startMediaServer();
}

const corsOrigins = (Deno.env.get("CORS_ORIGINS") || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

coreApp.runServer({
  port: Number(APP_PORT),
  typeGeneration: true,
  playground: ENV === "development",
  cors: corsOrigins,
});
