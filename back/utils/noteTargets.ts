import { ObjectId } from "lesan";
import { file, lab, lesson, practiceAssignment } from "../mod.ts";
import { assertPublished } from "./content.ts";
import { throwError } from "./throwError.ts";

const requireId = (targetId: unknown) => {
  if (typeof targetId !== "string" || !ObjectId.isValid(targetId)) {
    return throwError(
      "VALIDATION_FAILED: targetId is required for this note type",
    );
  }
  return new ObjectId(targetId);
};

export const assertNoteTarget = async ({
  userId,
  targetType,
  targetId,
}: {
  userId: string;
  targetType: string;
  targetId?: string;
}): Promise<void> => {
  if (targetType === "general") return;

  const _id = requireId(targetId);

  if (targetType === "lesson") {
    const founded = await lesson.findOne({
      filters: { _id },
      projection: { _id: 1, status: 1 },
    });
    assertPublished(founded);
    return;
  }

  if (targetType === "lab") {
    const founded = await lab.findOne({
      filters: { _id },
      projection: { _id: 1, status: 1 },
    });
    assertPublished(founded);
    return;
  }

  if (targetType === "practice") {
    const founded = await practiceAssignment.findOne({
      filters: { _id },
      projection: { _id: 1, user: { _id: 1 } },
    });
    if (!founded) return throwError("NOT_FOUND: Practice assignment not found");
    const ownerId = String(
      (founded.user as { _id?: unknown } | undefined)?._id ?? "",
    );
    if (ownerId !== userId) {
      throwError("FORBIDDEN: You do not own this practice assignment");
    }
    return;
  }

  if (targetType === "photo") {
    const founded = await file.findOne({
      filters: { _id },
      projection: { _id: 1, owner: { _id: 1 }, deletedAt: 1 },
    });
    if (!founded || founded.deletedAt) {
      return throwError("NOT_FOUND: Photo not found");
    }
    const ownerId = String(
      (founded.owner as { _id?: unknown } | undefined)?._id ?? "",
    );
    if (ownerId !== userId) {
      throwError("FORBIDDEN: You do not own this photo");
    }
  }
};
