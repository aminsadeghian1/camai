import type { Document } from "lesan";
import { createMediaToken } from "../signedUrl.ts";
import type { StorageAdapter } from "./types.ts";

const uploadDir = Deno.env.get("UPLOAD_DIR") || "uploads";
const mediaPort = Deno.env.get("MEDIA_PORT") || "1406";
const mediaBaseUrl = (Deno.env.get("MEDIA_PUBLIC_URL") ||
  `http://localhost:${mediaPort}`).replace(/\/$/, "");

const storageKey = (file: Document): string =>
  String(file.storageKey || file._id);

const pathFor = (file: Document): string => {
  const key = storageKey(file);
  if (key.includes("/") || key.includes("\\") || key.includes("..")) {
    throw new Error("Invalid local storage key");
  }
  return `${uploadDir}/${key}`;
};

const ensureDir = async () => {
  await Deno.mkdir(uploadDir, { recursive: true });
};

export const localAdapter: StorageAdapter = {
  driver: "local",

  async requestUpload(file, ttlSeconds) {
    await ensureDir();
    const token = await createMediaToken(
      String(file._id),
      "upload",
      ttlSeconds,
    );
    return {
      uploadUrl: `${mediaBaseUrl}/upload/${file._id}?token=${token}`,
      method: "PUT",
      headers: {
        "content-type": String(file.mimeType ?? "application/octet-stream"),
      },
      expiresIn: ttlSeconds,
    };
  },

  async requestDownload(file, ttlSeconds) {
    const token = await createMediaToken(
      String(file._id),
      "download",
      ttlSeconds,
    );
    return {
      url: `${mediaBaseUrl}/files/${file._id}?token=${token}`,
      expiresIn: ttlSeconds,
    };
  },

  async put(file, data) {
    await ensureDir();
    await Deno.writeFile(pathFor(file), data);
  },

  async get(file) {
    return await Deno.readFile(pathFor(file));
  },

  async head(file) {
    const stat = await Deno.stat(pathFor(file));
    return { size: stat.size };
  },

  async remove(file) {
    try {
      await Deno.remove(pathFor(file));
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound)) throw error;
    }
  },
};
