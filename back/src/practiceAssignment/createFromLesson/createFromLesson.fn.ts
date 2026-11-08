import { type ActFn, ObjectId } from "lesan";
import { lesson, practiceAssignment } from "../../../mod.ts";
import { assertPublished, ensureSkill, getAuth, throwError } from "@lib";

export const createFromLessonFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user } = await getAuth();
  const userId = new ObjectId(String(user._id));
  const lessonId = new ObjectId(String(set.lessonId));

  const foundedLesson = await lesson.findOne({
    filters: { _id: lessonId },
    projection: { _id: 1, status: 1, title: 1, objective: 1 },
  });

  if (!foundedLesson) return throwError("NOT_FOUND: Lesson not found");
  assertPublished(foundedLesson);

  const existing = await practiceAssignment.findOne({
    filters: { "user._id": userId, "lesson._id": lessonId },
    projection: get,
  });

  if (existing) return existing;

  let skillId: ObjectId | undefined;
  if (typeof set.skillKey === "string" && set.skillKey) {
    const foundedSkill = await ensureSkill(set.skillKey);
    if (!foundedSkill) {
      return throwError("VALIDATION_FAILED: Skill could not be resolved");
    }
    skillId = new ObjectId(String(foundedSkill._id));
  }

  const now = new Date();
  const created = await practiceAssignment.insertOne({
    doc: {
      title: set.title ?? foundedLesson.title,
      objective: set.objective ?? foundedLesson.objective ??
        `Practice the concept from ${foundedLesson.title}`,
      constraints: set.constraints ?? [],
      requirements: set.requirements ?? [],
      ...(set.requiredConcept ? { requiredConcept: set.requiredConcept } : {}),
      ...(set.dueAt ? { dueAt: set.dueAt } : {}),
      status: "assigned",
      createdAt: now,
      updatedAt: now,
    },
    relations: {
      user: { _ids: userId },
      lesson: { _ids: lessonId },
      ...(skillId ? { skill: { _ids: skillId } } : {}),
      ...(set.sourceLabId
        ? { sourceLab: { _ids: new ObjectId(String(set.sourceLabId)) } }
        : {}),
    },
    projection: get,
  });

  if (!created) {
    return throwError("VALIDATION_FAILED: Assignment could not be created");
  }

  return created;
};
