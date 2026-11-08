import { ObjectId } from "lesan";
import {
  lab,
  labAttempt,
  labChallenge,
  labEvent,
  labResult,
  lesson,
  lessonProgress,
} from "../mod.ts";
import { applySkillEvidence, skillKeyForLab } from "./skillEngine.ts";
import { evaluateAchievements } from "./achievements.ts";
import { assertPublished } from "./content.ts";
import {
  deriveLabMetrics,
  type LabControls,
  type LabType,
  scoreLabAttempt,
} from "./labScoring.ts";
import { throwError } from "./throwError.ts";

type Projection = NonNullable<
  Parameters<typeof lesson.findOne>[0]["projection"]
>;

const publishedLesson = async (lessonId: string, projection: Projection) => {
  const founded = await lesson.findOne({
    filters: { _id: new ObjectId(lessonId) },
    projection: { _id: 1, status: 1, ...projection } as Projection,
  });
  if (!founded) return throwError("NOT_FOUND: Lesson not found");
  assertPublished(founded);
  return founded;
};

export const startLessonProgress = async ({
  userId,
  lessonId,
  projection = {},
}: {
  userId: string;
  lessonId: string;
  projection?: Projection;
}) => {
  const userObjectId = new ObjectId(userId);
  const lessonObjectId = new ObjectId(lessonId);
  const now = new Date();

  const foundedLesson = await publishedLesson(lessonId, {
    version: 1,
    blocks: { id: 1 },
  });

  const existing = await lessonProgress.findOne({
    filters: { "user._id": userObjectId, "lesson._id": lessonObjectId },
    projection,
  });

  if (existing) {
    return await lessonProgress.findOneAndUpdate({
      filter: { _id: new ObjectId(String(existing._id)) },
      update: { $set: { lastOpenedAt: now, updatedAt: now } },
      projection,
    });
  }

  const created = await lessonProgress.insertOne({
    doc: {
      version: Number(foundedLesson.version ?? 1),
      currentBlock: 0,
      status: "inProgress",
      lastOpenedAt: now,
      createdAt: now,
      updatedAt: now,
    },
    relations: {
      user: { _ids: userObjectId },
      lesson: { _ids: lessonObjectId },
    },
    projection,
  });

  if (!created) {
    return throwError(
      "VALIDATION_FAILED: Lesson progress could not be created",
    );
  }

  return created;
};

const updateProgress = async ({
  userId,
  lessonId,
  projection,
  complete,
  currentBlock,
}: {
  userId: string;
  lessonId: string;
  projection: Projection;
  complete: boolean;
  currentBlock?: number;
}) => {
  const userObjectId = new ObjectId(userId);
  const lessonObjectId = new ObjectId(lessonId);
  const now = new Date();
  const foundedLesson = await publishedLesson(lessonId, { blocks: { id: 1 } });

  const existing = await lessonProgress.findOne({
    filters: { "user._id": userObjectId, "lesson._id": lessonObjectId },
    projection: { _id: 1, status: 1 } as Projection,
  });

  if (!existing) {
    return throwError(
      `NOT_FOUND: Start the lesson before ${
        complete ? "completing it" : "updating progress"
      }`,
    );
  }

  if (existing.status === "completed") {
    return await lessonProgress.findOne({
      filters: { _id: new ObjectId(String(existing._id)) },
      projection,
    });
  }

  const blocks = Array.isArray(foundedLesson.blocks)
    ? foundedLesson.blocks
    : [];
  const block = complete ? Math.max(blocks.length - 1, 0) : Math.min(
    Math.max(Number(currentBlock ?? 0), 0),
    Math.max(blocks.length - 1, 0),
  );

  return await lessonProgress.findOneAndUpdate({
    filter: { _id: new ObjectId(String(existing._id)) },
    update: {
      $set: {
        currentBlock: block,
        status: complete ? "completed" : "inProgress",
        lastOpenedAt: now,
        updatedAt: now,
        ...(complete ? { completedAt: now } : {}),
      },
    },
    projection,
  });
};

export const updateLessonProgress = async (args: {
  userId: string;
  lessonId: string;
  currentBlock?: number;
  projection?: Projection;
}) =>
  await updateProgress({
    ...args,
    projection: args.projection ?? {},
    complete: false,
  });

export const completeLessonProgress = async (args: {
  userId: string;
  lessonId: string;
  projection?: Projection;
}) =>
  await updateProgress({
    ...args,
    projection: args.projection ?? {},
    complete: true,
  });

export const createLabAttempt = async ({
  userId,
  labId,
  challengeId,
  operationId,
  controls: rawControls,
  prediction,
  projection = {},
}: {
  userId: string;
  labId: string;
  challengeId?: string;
  operationId: string;
  controls?: Record<string, unknown>;
  prediction?: Record<string, unknown>;
  projection?: Projection;
}) => {
  const userObjectId = new ObjectId(userId);
  const labObjectId = new ObjectId(labId);

  const foundedLab = await lab.findOne({
    filters: { _id: labObjectId },
    projection: {
      _id: 1,
      labType: 1,
      version: 1,
      status: 1,
      scene: { _id: 1 },
    },
  });

  if (!foundedLab) return throwError("NOT_FOUND: Lab not found");
  assertPublished(foundedLab);

  let challengeObjectId: ObjectId | undefined;

  if (challengeId) {
    const foundedChallenge = await labChallenge.findOne({
      filters: { _id: new ObjectId(String(challengeId)) },
      projection: { _id: 1, status: 1, lab: { _id: 1 } } as Projection,
    });

    if (!foundedChallenge) {
      return throwError("NOT_FOUND: Lab challenge not found");
    }
    assertPublished(foundedChallenge);

    if (
      String((foundedChallenge.lab as { _id?: unknown } | undefined)?._id) !==
        String(labObjectId)
    ) {
      return throwError("VALIDATION_FAILED: Challenge does not belong to lab");
    }

    challengeObjectId = new ObjectId(String(foundedChallenge._id));
  }

  const controls = Object.fromEntries(
    Object.entries(rawControls ?? {}).filter(([, value]) =>
      typeof value === "number" && Number.isFinite(value)
    ),
  ) as LabControls;
  const now = new Date();
  const doc = {
    labVersion: Number(foundedLab.version ?? 1),
    ...(foundedLab.scene
      ? { sceneId: String((foundedLab.scene as { _id?: unknown })._id ?? "") }
      : {}),
    controls,
    derivedMetrics: deriveLabMetrics(
      foundedLab.labType as LabType,
      controls,
    ),
    ...(prediction ? { prediction } : {}),
    startedAt: now,
    operationId,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const created = await labAttempt.insertOne({
      doc,
      relations: {
        user: { _ids: userObjectId },
        lab: { _ids: labObjectId },
        ...(challengeObjectId
          ? { challenge: { _ids: challengeObjectId } }
          : {}),
      },
      projection,
    });

    if (!created) {
      return throwError("VALIDATION_FAILED: Lab attempt could not be created");
    }

    return created;
  } catch {
    const existing = await labAttempt.findOne({
      filters: { "user._id": userObjectId, operationId },
      projection,
    });

    if (!existing) {
      return throwError("DUPLICATE_OPERATION: Lab attempt already exists");
    }

    return existing;
  }
};

export const completeLabAttempt = async ({
  userId,
  attemptId,
  allowStaff = false,
  projection = {},
}: {
  userId: string;
  attemptId: string;
  allowStaff?: boolean;
  projection?: Projection;
}) => {
  const _id = new ObjectId(attemptId);

  const attempt = await labAttempt.findOne({
    filters: { _id },
    projection: {
      _id: 1,
      controls: 1,
      derivedMetrics: 1,
      prediction: 1,
      completedAt: 1,
      operationId: 1,
      user: { _id: 1 },
      lab: { _id: 1, labType: 1, version: 1 },
      challenge: { _id: 1, rules: 1 },
    },
  });

  if (!attempt) return throwError("NOT_FOUND: Lab attempt not found");

  const ownerId = String(
    (attempt.user as { _id?: unknown } | undefined)?._id ?? "",
  );
  if (ownerId !== userId && !allowStaff) {
    return throwError("FORBIDDEN: You do not own this attempt");
  }

  if (attempt.completedAt) {
    return await labAttempt.findOne({
      filters: { _id },
      projection,
    });
  }

  const labType = (attempt.lab as { labType?: string } | undefined)
    ?.labType as LabType | undefined;
  if (!labType) return throwError("VALIDATION_FAILED: Lab type is missing");

  const challengeRules = (attempt.challenge as
    | { rules?: { target?: Record<string, unknown>; passScore?: number } }
    | undefined)?.rules;

  const evaluation = scoreLabAttempt({
    labType,
    controls: (attempt.controls ?? {}) as LabControls,
    derivedMetrics: (attempt.derivedMetrics ?? {}) as Record<string, number>,
    challengeRules,
    prediction: attempt.prediction as
      | { metric?: string; value?: number }
      | undefined,
  });

  const now = new Date();

  await labResult.insertOne({
    doc: {
      score: evaluation.score,
      metrics: evaluation.metrics,
      createdAt: now,
      updatedAt: now,
    },
    relations: { attempt: { _ids: _id } },
  });

  const updated = await labAttempt.findOneAndUpdate({
    filter: { _id },
    update: {
      $set: {
        derivedMetrics: evaluation.metrics,
        challengeResult: {
          score: evaluation.score,
          passed: evaluation.passed,
          matchedControls: evaluation.matchedControls,
          expectedControls: evaluation.expectedControls,
        },
        completedAt: now,
        updatedAt: now,
      },
    },
    projection,
  });

  await applySkillEvidence({
    userId: ownerId,
    skillKey: skillKeyForLab(labType),
    type: challengeRules ? "challenge" : "lab",
    refId: String(_id),
    score: evaluation.score,
  });
  await evaluateAchievements(ownerId);

  return updated;
};

export const addLabEvents = async ({
  userId,
  attemptId,
  events,
}: {
  userId: string;
  attemptId: string;
  events: {
    operationId: string;
    eventType: string;
    payload?: Record<string, unknown>;
  }[];
}) => {
  const attemptObjectId = new ObjectId(attemptId);
  const attempt = await labAttempt.findOne({
    filters: { _id: attemptObjectId },
    projection: { _id: 1, user: { _id: 1 } } as Projection,
  });

  if (!attempt) return throwError("NOT_FOUND: Lab attempt not found");
  if (
    String((attempt.user as { _id?: unknown } | undefined)?._id ?? "") !==
      userId
  ) {
    return throwError("FORBIDDEN: You do not own this attempt");
  }

  let accepted = 0;
  let duplicates = 0;
  const now = new Date();

  for (const event of events) {
    try {
      await labEvent.insertOne({
        doc: {
          operationId: event.operationId,
          eventType: event.eventType,
          payload: event.payload ?? {},
          createdAt: now,
          updatedAt: now,
        },
        relations: { attempt: { _ids: attemptObjectId } },
        projection: { _id: 1 },
      });
      accepted++;
    } catch {
      duplicates++;
    }
  }

  return { accepted, duplicates };
};
