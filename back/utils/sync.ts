import { ObjectId } from "lesan";
import { db } from "../mod.ts";
import {
  addLabEvents,
  completeLabAttempt,
  completeLessonProgress,
  createLabAttempt,
  createUserNote,
  removeUserNote,
  startLessonProgress,
  updateLessonProgress,
  updateUserNote,
} from "./mod.ts";
import { throwError } from "./throwError.ts";

export type SyncOperation = {
  operationId: string;
  entityType: string;
  op: string;
  payload: Record<string, unknown>;
  clientTimestamp?: string;
};

export type SyncResult = {
  operationId: string;
  status: "ack" | "duplicate" | "rejected";
  entityType?: string;
  data?: unknown;
  code?: string;
  message?: string;
};

const collection = (name: string) => db.collection(name);
const syncCollection = () => collection("syncOperation");

const parseError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  const [code, ...rest] = message.split(":");
  return {
    code: (code || "ERROR").trim(),
    message: (rest.join(":") || message).trim(),
  };
};

const applyOperation = async (
  userId: string,
  operation: SyncOperation,
): Promise<unknown> => {
  const payload = operation.payload ?? {};

  if (operation.entityType === "note") {
    if (operation.op === "create") {
      return await createUserNote(userId, {
        targetType: String(payload.targetType ?? "general"),
        targetId: payload.targetId ? String(payload.targetId) : undefined,
        body: String(payload.body ?? ""),
        isPinned: Boolean(payload.isPinned),
        operationId: operation.operationId,
      });
    }
    if (operation.op === "update") {
      return await updateUserNote(userId, {
        _id: String(payload._id ?? ""),
        body: payload.body !== undefined ? String(payload.body) : undefined,
        isPinned: payload.isPinned !== undefined
          ? Boolean(payload.isPinned)
          : undefined,
      });
    }
    if (operation.op === "remove") {
      return await removeUserNote(userId, String(payload._id ?? ""));
    }
  }

  if (operation.entityType === "lessonProgress") {
    const lessonId = String(payload.lessonId ?? "");
    if (operation.op === "start") {
      return await startLessonProgress({ userId, lessonId });
    }
    if (operation.op === "update") {
      return await updateLessonProgress({
        userId,
        lessonId,
        currentBlock: Number(payload.currentBlock ?? 0),
      });
    }
    if (operation.op === "complete") {
      return await completeLessonProgress({ userId, lessonId });
    }
  }

  if (operation.entityType === "labAttempt") {
    if (operation.op === "create") {
      return await createLabAttempt({
        userId,
        labId: String(payload.labId ?? ""),
        challengeId: payload.challengeId
          ? String(payload.challengeId)
          : undefined,
        operationId: operation.operationId,
        controls: (payload.controls ?? {}) as Record<string, unknown>,
        prediction: payload.prediction as Record<string, unknown> | undefined,
      });
    }
    if (operation.op === "complete") {
      return await completeLabAttempt({
        userId,
        attemptId: String(payload._id ?? ""),
      });
    }
  }

  if (operation.entityType === "labEvent" && operation.op === "addBatch") {
    const events = Array.isArray(payload.events)
      ? payload.events as {
        operationId: string;
        eventType: string;
        payload?: Record<string, unknown>;
      }[]
      : [];
    return await addLabEvents({
      userId,
      attemptId: String(payload.attemptId ?? ""),
      events,
    });
  }

  return throwError(
    `VALIDATION_FAILED: Unsupported sync operation ${operation.entityType}.${operation.op}`,
  );
};

export const applySyncOperation = async (
  userId: string,
  operation: SyncOperation,
): Promise<SyncResult> => {
  if (!operation?.operationId || !operation.entityType || !operation.op) {
    return {
      operationId: String(operation?.operationId ?? ""),
      status: "rejected",
      code: "VALIDATION_FAILED",
      message: "operationId, entityType and op are required",
    };
  }

  const userObjectId = new ObjectId(userId);
  const existing = await syncCollection().findOne({
    userId: userObjectId,
    operationId: operation.operationId,
  });

  if (existing) {
    return {
      operationId: operation.operationId,
      status: "duplicate",
      entityType: operation.entityType,
      data: existing.data,
    };
  }

  try {
    const data = await applyOperation(userId, operation);
    await syncCollection().updateOne(
      { userId: userObjectId, operationId: operation.operationId },
      {
        $setOnInsert: {
          userId: userObjectId,
          operationId: operation.operationId,
          entityType: operation.entityType,
          op: operation.op,
          status: "ack",
          data,
          clientTimestamp: operation.clientTimestamp,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );
    return {
      operationId: operation.operationId,
      status: "ack",
      entityType: operation.entityType,
      data,
    };
  } catch (error) {
    const parsed = parseError(error);
    return {
      operationId: operation.operationId,
      status: "rejected",
      entityType: operation.entityType,
      code: parsed.code,
      message: parsed.message,
    };
  }
};

const parseCursor = (cursor?: string) => {
  if (!cursor) {
    return { date: new Date(0), id: new ObjectId("000000000000000000000000") };
  }
  const [millis, id] = cursor.split(":");
  const date = new Date(Number(millis));
  return {
    date: Number.isNaN(date.getTime()) ? new Date(0) : date,
    id: ObjectId.isValid(id)
      ? new ObjectId(id)
      : new ObjectId("000000000000000000000000"),
  };
};

const cursorFilter = (cursor: string | undefined) => {
  const parsed = parseCursor(cursor);
  return {
    $or: [
      { updatedAt: { $gt: parsed.date } },
      { updatedAt: parsed.date, _id: { $gt: parsed.id } },
    ],
  };
};

const project = (fields: string[]) =>
  Object.fromEntries(
    [...fields, "_id", "updatedAt"].map((field) => [field, 1]),
  );

const limit = (value: unknown) =>
  Math.min(Math.max(Number(value ?? 200), 1), 500);

export const pullChanges = async (
  userId: string,
  cursor: string | undefined,
  pageLimit: unknown,
) => {
  const userObjectId = new ObjectId(userId);
  const since = cursorFilter(cursor);
  const take = limit(pageLimit);
  const owned = (extra: Record<string, unknown> = {}) => ({
    ...since,
    "user._id": userObjectId,
    ...extra,
  });
  const published = (extra: Record<string, unknown> = {}) => ({
    ...since,
    status: "Published",
    ...extra,
  });

  const assignmentIds = await collection("practiceAssignment")
    .find({ "user._id": userObjectId }, { projection: { _id: 1 } })
    .toArray();
  const attemptIds = await collection("labAttempt")
    .find({ "user._id": userObjectId }, { projection: { _id: 1 } })
    .toArray();
  const ids = (items: { _id: unknown }[]) => items.map((item) => item._id);

  const [
    notes,
    lessonProgress,
    labAttempts,
    labResults,
    practiceAssignments,
    practiceSubmissions,
    aiReviews,
    notifications,
    recommendations,
    userAchievements,
    learningPaths,
    courses,
    modules,
    lessons,
    labs,
    labScenes,
    labChallenges,
  ] = await Promise.all([
    collection("note").find(owned(), {
      projection: project([
        "targetType",
        "targetId",
        "body",
        "isPinned",
        "deletedAt",
      ]),
    }).limit(take).toArray(),
    collection("lessonProgress").find(owned(), {
      projection: project([
        "version",
        "currentBlock",
        "status",
        "completedAt",
        "lesson",
      ]),
    }).limit(take).toArray(),
    collection("labAttempt").find(owned(), {
      projection: project([
        "labVersion",
        "sceneId",
        "controls",
        "derivedMetrics",
        "prediction",
        "challengeResult",
        "startedAt",
        "completedAt",
        "lab",
        "challenge",
      ]),
    }).limit(take).toArray(),
    attemptIds.length
      ? collection("labResult").find({
        ...since,
        "attempt._id": { $in: ids(attemptIds) },
      }, { projection: project(["score", "metrics", "attempt"]) }).limit(take)
        .toArray()
      : Promise.resolve([]),
    collection("practiceAssignment").find(owned(), {
      projection: project([
        "title",
        "objective",
        "constraints",
        "requirements",
        "requiredConcept",
        "status",
        "dueAt",
        "lesson",
        "skill",
        "sourceLab",
      ]),
    }).limit(take).toArray(),
    assignmentIds.length
      ? collection("practiceSubmission").find({
        ...since,
        "assignment._id": { $in: ids(assignmentIds) },
      }, {
        projection: project([
          "status",
          "note",
          "exif",
          "submittedAt",
          "reviewedAt",
          "assignment",
          "media",
        ]),
      }).limit(take).toArray()
      : Promise.resolve([]),
    collection("aiReview").find(owned(), {
      projection: project([
        "provider",
        "model",
        "promptVersion",
        "reviewVersion",
        "status",
        "result",
        "attempts",
        "submission",
      ]),
    }).limit(take).toArray(),
    collection("notification").find(owned(), {
      projection: project([
        "type",
        "title",
        "body",
        "readAt",
        "scheduledAt",
        "dedupeKey",
      ]),
    }).limit(take).toArray(),
    collection("recommendation").find(owned(), {
      projection: project([
        "reasonCode",
        "activityType",
        "activityId",
        "explanation",
        "status",
      ]),
    }).limit(take).toArray(),
    collection("userAchievement").find(owned(), {
      projection: project(["awardedAt", "achievement"]),
    }).limit(take).toArray(),
    collection("learningPath").find(published(), {
      projection: project(["key", "title", "description", "status", "version"]),
    }).limit(take).toArray(),
    collection("course").find(published(), {
      projection: project([
        "title",
        "description",
        "path",
        "status",
        "version",
      ]),
    }).limit(take).toArray(),
    collection("module").find(published(), {
      projection: project([
        "title",
        "description",
        "course",
        "status",
        "version",
      ]),
    }).limit(take).toArray(),
    collection("lesson").find(published(), {
      projection: project([
        "key",
        "title",
        "objective",
        "blocks",
        "module",
        "status",
        "version",
      ]),
    }).limit(take).toArray(),
    collection("lab").find(published(), {
      projection: project([
        "labType",
        "title",
        "configuration",
        "lesson",
        "scene",
        "status",
        "version",
      ]),
    }).limit(take).toArray(),
    collection("labScene").find(published(), {
      projection: project([
        "key",
        "title",
        "configuration",
        "status",
        "version",
      ]),
    }).limit(take).toArray(),
    collection("labChallenge").find(published(), {
      projection: project([
        "title",
        "rules",
        "lab",
        "status",
        "version",
      ]),
    }).limit(take).toArray(),
  ]);

  const groups = {
    notes,
    lessonProgress,
    labAttempts,
    labResults,
    practiceAssignments,
    practiceSubmissions,
    aiReviews,
    notifications,
    recommendations,
    userAchievements,
    learningPaths,
    courses,
    modules,
    lessons,
    labs,
    labScenes,
    labChallenges,
  };

  let latestDate = parseCursor(cursor).date;
  let latestId = parseCursor(cursor).id;
  for (const items of Object.values(groups)) {
    for (const item of items) {
      const updatedAt = item.updatedAt instanceof Date
        ? item.updatedAt
        : new Date(0);
      if (
        updatedAt > latestDate ||
        (updatedAt.getTime() === latestDate.getTime() &&
          String(item._id) > String(latestId))
      ) {
        latestDate = updatedAt;
        latestId = item._id as ObjectId;
      }
    }
  }

  return {
    ...groups,
    cursor: `${latestDate.getTime()}:${String(latestId)}`,
  };
};
