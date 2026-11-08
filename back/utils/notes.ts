import { ObjectId } from "lesan";
import { note } from "../mod.ts";
import { assertNoteTarget } from "./noteTargets.ts";
import { throwError } from "./throwError.ts";

type NoteInput = {
  targetType: string;
  targetId?: string;
  body: string;
  isPinned?: boolean;
  operationId: string;
};

type NoteProjection = NonNullable<
  Parameters<typeof note.findOne>[0]["projection"]
>;

const ownerIdOf = (doc: Record<string, unknown>) =>
  String((doc.user as { _id?: unknown } | undefined)?._id ?? "");

export const createUserNote = async (
  userId: string,
  input: NoteInput,
  projection: NoteProjection = {},
) => {
  const userObjectId = new ObjectId(userId);

  const existing = await note.findOne({
    filters: { "user._id": userObjectId, operationId: input.operationId },
    projection,
  });
  if (existing) return existing;

  await assertNoteTarget({
    userId,
    targetType: input.targetType,
    targetId: input.targetId,
  });

  const now = new Date();
  const created = await note.insertOne({
    doc: {
      targetType: input.targetType,
      ...(input.targetId ? { targetId: input.targetId } : {}),
      body: input.body,
      isPinned: input.isPinned ?? false,
      operationId: input.operationId,
      createdAt: now,
      updatedAt: now,
    },
    relations: { user: { _ids: userObjectId } },
    projection,
  });

  if (!created) {
    return throwError("VALIDATION_FAILED: Note could not be created");
  }

  return created;
};

export const updateUserNote = async (
  userId: string,
  input: {
    _id: string;
    body?: string;
    isPinned?: boolean;
  },
  projection: NoteProjection = {},
) => {
  const _id = new ObjectId(input._id);
  const existing = await note.findOne({
    filters: { _id },
    projection: { _id: 1, user: { _id: 1 }, deletedAt: 1 } as NoteProjection,
  });

  if (!existing || existing.deletedAt) {
    return throwError("NOT_FOUND: Note not found");
  }
  if (ownerIdOf(existing) !== userId) {
    return throwError("FORBIDDEN: You do not own this note");
  }

  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (input.body !== undefined) update.body = input.body;
  if (input.isPinned !== undefined) update.isPinned = input.isPinned;

  return await note.findOneAndUpdate({
    filter: { _id },
    update: { $set: update },
    projection,
  });
};

export const removeUserNote = async (userId: string, noteId: string) => {
  const _id = new ObjectId(noteId);
  const existing = await note.findOne({
    filters: { _id },
    projection: { _id: 1, user: { _id: 1 }, deletedAt: 1 } as NoteProjection,
  });

  if (!existing || existing.deletedAt) {
    return throwError("NOT_FOUND: Note not found");
  }
  if (ownerIdOf(existing) !== userId) {
    return throwError("FORBIDDEN: You do not own this note");
  }

  const now = new Date();
  await note.findOneAndUpdate({
    filter: { _id },
    update: { $set: { deletedAt: now, updatedAt: now } },
    projection: { _id: 1 },
  });

  return { success: 1 };
};
