import type { Document } from "lesan";
import { AwsClient } from "aws4fetch";
import type { StorageAdapter } from "./types.ts";

const endpoint = (Deno.env.get("S3_ENDPOINT") || "").replace(/\/$/, "");
const region = Deno.env.get("S3_REGION") || "us-east-1";
const bucket = Deno.env.get("S3_BUCKET") || "camai-private";
const accessKeyId = Deno.env.get("S3_ACCESS_KEY_ID") || "";
const secretAccessKey = Deno.env.get("S3_SECRET_ACCESS_KEY") || "";
const sessionToken = Deno.env.get("S3_SESSION_TOKEN");
const forcePathStyle = (Deno.env.get("S3_FORCE_PATH_STYLE") || "true") !==
  "false";

const client = new AwsClient({
  accessKeyId,
  secretAccessKey,
  sessionToken,
  region,
  service: "s3",
});

const keyFor = (file: Document): string =>
  String(file.storageKey || `camai/${file._id}`);

const objectUrl = (file: Document): string => {
  const encodedKey = keyFor(file).split("/").map(encodeURIComponent).join("/");
  return forcePathStyle
    ? `${endpoint}/${bucket}/${encodedKey}`
    : `${endpoint.replace("://", `://${bucket}.`)}/${encodedKey}`;
};

const assertConfigured = () => {
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error("S3 storage is not configured");
  }
};

const sign = async (
  file: Document,
  method: string,
  ttlSeconds: number,
  headers: Record<string, string> = {},
) => {
  assertConfigured();
  const url = new URL(objectUrl(file));
  url.searchParams.set("X-Amz-Expires", String(Math.max(1, ttlSeconds)));
  const signed = await client.sign(url.toString(), {
    method,
    headers,
    aws: { signQuery: true, service: "s3", region },
  });
  return signed.url;
};

export const s3Adapter: StorageAdapter = {
  driver: "s3",

  async requestUpload(file, ttlSeconds) {
    const url = await sign(file, "PUT", ttlSeconds, {
      "content-type": String(file.mimeType ?? "application/octet-stream"),
    });
    return {
      uploadUrl: url,
      method: "PUT",
      headers: {
        "content-type": String(file.mimeType ?? "application/octet-stream"),
      },
      expiresIn: ttlSeconds,
    };
  },

  async requestDownload(file, ttlSeconds) {
    return { url: await sign(file, "GET", ttlSeconds), expiresIn: ttlSeconds };
  },

  async put(file, data, contentType) {
    const url = await sign(file, "PUT", 900, { "content-type": contentType });
    const response = await fetch(url, {
      method: "PUT",
      headers: { "content-type": contentType },
      body: data as BodyInit,
    });
    if (!response.ok) throw new Error(`S3 upload failed: ${response.status}`);
  },

  async get(file) {
    const response = await fetch(await sign(file, "GET", 900));
    if (!response.ok) throw new Error(`S3 read failed: ${response.status}`);
    return new Uint8Array(await response.arrayBuffer());
  },

  async head(file) {
    const response = await fetch(await sign(file, "HEAD", 900));
    if (!response.ok) throw new Error(`S3 head failed: ${response.status}`);
    return {
      size: Number(response.headers.get("content-length") || 0),
      contentType: response.headers.get("content-type") || undefined,
    };
  },

  async remove(file) {
    const response = await fetch(await sign(file, "DELETE", 900));
    if (!response.ok && response.status !== 404) {
      throw new Error(`S3 delete failed: ${response.status}`);
    }
  },
};
