import { ObjectId } from "lesan";
import { file } from "../mod.ts";
import { getStorage } from "./storage/index.ts";
import { getAuth } from "./grantAccess.ts";
import { reviewerCanAccessFile } from "./reviewScope.ts";
import {
  detectMedia,
  mediaKindForMime,
  safeMetadata,
  validateMediaSize,
  verifyDeclaredMime,
} from "./media.ts";
import { throwError } from "./throwError.ts";

export type FileProjection = Parameters<typeof file.findOne>[0]["projection"];

const DEFAULT_UPLOAD_TTL_SECONDS = 900;

export const requestFileUpload = async (
  input: {
    name: string;
    mimeType: string;
    size: number;
  },
  ttlSeconds = DEFAULT_UPLOAD_TTL_SECONDS,
) => {
  const { user } = await getAuth();
  validateMediaSize(input.size);

  if (input.name.trim().length === 0 || input.name.length > 255) {
    return throwError("VALIDATION_FAILED: File name must be 1..255 characters");
  }

  const created = await file.insertOne({
    doc: {
      name: input.name.trim(),
      mimeType: input.mimeType,
      size: input.size,
      type: mediaKindForMime(input.mimeType),
      status: "pending",
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    relations: {
      owner: { _ids: new ObjectId(String(user._id)) },
    },
  });

  if (!created) {
    return throwError("MEDIA_UPLOAD_FAILED: File could not be created");
  }

  const upload = await getStorage().requestUpload(created, ttlSeconds);

  return { file: created, upload };
};

export const completeFileUpload = async (
  fileId: string,
  projection?: FileProjection,
) => {
  const { user } = await getAuth();

  if (!ObjectId.isValid(fileId)) {
    return throwError("NOT_FOUND: File not found");
  }

  const existing = await file.findOne({
    filters: { _id: new ObjectId(fileId) },
    projection: {
      _id: 1,
      name: 1,
      mimeType: 1,
      size: 1,
      type: 1,
      status: 1,
      deletedAt: 1,
      metadata: 1,
      owner: { _id: 1 },
    },
  });

  if (!existing) return throwError("NOT_FOUND: File not found");

  const owner = existing.owner as { _id?: unknown } | undefined;
  if (!owner?._id || String(owner._id) !== String(user._id)) {
    return throwError("FORBIDDEN: You do not own this file");
  }

  if (existing.deletedAt) {
    return throwError("NOT_FOUND: File not found");
  }

  if (existing.status === "uploaded") {
    return await file.findOne({
      filters: { _id: new ObjectId(fileId) },
      projection: projection ?? { _id: 1 },
    });
  }

  if (existing.status !== "pending") {
    return throwError("MEDIA_UPLOAD_FAILED: File is not awaiting upload");
  }

  const storage = getStorage();
  let bytes: Uint8Array;

  try {
    bytes = await storage.get(existing);
  } catch {
    return throwError("MEDIA_UPLOAD_FAILED: Uploaded file was not found");
  }

  return await verifyAndFinalizeFile(existing, bytes, projection);
};

export const verifyAndFinalizeFile = async (
  existing: Record<string, unknown>,
  bytes: Uint8Array,
  projection?: FileProjection,
) => {
  validateMediaSize(bytes.length);
  const detected = detectMedia(bytes);
  verifyDeclaredMime(detected, String(existing.mimeType ?? ""));

  const updated = await file.findOneAndUpdate({
    filter: { _id: new ObjectId(String(existing._id)) },
    update: {
      $set: {
        size: bytes.length,
        type: detected.type,
        mimeType: detected.mimeType,
        status: "uploaded",
        metadata: safeMetadata(detected),
        updatedAt: new Date(),
      },
    },
    projection: projection ?? { _id: 1, status: 1 },
  });

  return updated ??
    throwError("MEDIA_UPLOAD_FAILED: File could not be finalized");
};

const findSignableFile = async (fileId: string) => {
  if (!ObjectId.isValid(fileId)) return null;

  const existing = await file.findOne({
    filters: { _id: new ObjectId(fileId) },
    projection: {
      _id: 1,
      name: 1,
      mimeType: 1,
      size: 1,
      type: 1,
      status: 1,
      deletedAt: 1,
      metadata: 1,
      owner: { _id: 1 },
    },
  });

  if (!existing || existing.deletedAt) return null;

  return existing;
};

const requestFileDownload = async (
  existing: NonNullable<Awaited<ReturnType<typeof findSignableFile>>>,
  ttlSeconds: number,
) => {
  if (existing.status !== "uploaded") {
    return throwError("NOT_FOUND: File is not ready");
  }

  const ttl = Math.min(Math.max(Math.trunc(ttlSeconds), 30), 3600);
  const download = await getStorage().requestDownload(existing, ttl);

  return { url: download.url, expiresIn: download.expiresIn };
};

export const signedFileUrl = async (
  fileId: string,
  ttlSeconds = 900,
): Promise<{ url: string; expiresIn: number }> => {
  const { user, activeRole } = await getAuth();
  const existing = await findSignableFile(fileId);

  if (!existing) {
    return throwError("NOT_FOUND: File not found");
  }

  const owner = existing.owner as { _id?: unknown } | undefined;
  const isOwner = Boolean(owner?._id) &&
    String(owner?._id) === String(user._id);
  const isStaff = activeRole.name === "Manager" || activeRole.name === "Admin";

  if (!isOwner && !isStaff) {
    return throwError("FORBIDDEN: You cannot access this file");
  }

  return await requestFileDownload(existing, ttlSeconds);
};

export const signedReviewMediaUrl = async (
  fileId: string,
  ttlSeconds = 900,
): Promise<{ url: string; expiresIn: number }> => {
  const { user, activeRole } = await getAuth();
  const existing = await findSignableFile(fileId);

  if (!existing) {
    return throwError("NOT_FOUND: File not found");
  }

  const owner = existing.owner as { _id?: unknown } | undefined;
  const isOwner = Boolean(owner?._id) &&
    String(owner?._id) === String(user._id);
  const isStaff = activeRole.name === "Manager" || activeRole.name === "Admin";

  if (!isOwner && !isStaff) {
    const isAssigned = activeRole.name === "Reviewer" &&
      await reviewerCanAccessFile(String(user._id), String(existing._id));

    if (!isAssigned) {
      return throwError("FORBIDDEN: You cannot access this file");
    }
  }

  return await requestFileDownload(existing, ttlSeconds);
};
