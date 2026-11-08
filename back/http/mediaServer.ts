import { ObjectId } from "lesan";
import { file } from "../mod.ts";
import { MAX_MEDIA_BYTES } from "../utils/media.ts";
import { verifyMediaToken } from "../utils/signedUrl.ts";
import { getStorage } from "../utils/storage/index.ts";

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const loadFile = async (fileId: string) => {
  if (!ObjectId.isValid(fileId)) return null;
  return await file.findOne({
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
      storageKey: 1,
      owner: { _id: 1 },
    },
  });
};

const readToken = (url: URL) => url.searchParams.get("token") ?? "";

const handleUpload = async (request: Request, fileId: string, url: URL) => {
  if (request.method !== "PUT") {
    return json(405, { code: "METHOD_NOT_ALLOWED", message: "Use PUT" });
  }

  if (!(await verifyMediaToken(readToken(url), fileId, "upload"))) {
    return json(403, {
      code: "FORBIDDEN",
      message: "Invalid or expired upload token",
    });
  }

  const storedFile = await loadFile(fileId);
  if (!storedFile) {
    return json(404, { code: "NOT_FOUND", message: "File not found" });
  }

  if (storedFile.status !== "pending") {
    return json(409, {
      code: "MEDIA_UPLOAD_FAILED",
      message: "File is not awaiting upload",
    });
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_MEDIA_BYTES) {
    return json(413, {
      code: "MEDIA_UPLOAD_FAILED",
      message: "File exceeds the 25 MB limit",
    });
  }

  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.length === 0) {
    return json(400, {
      code: "MEDIA_UPLOAD_FAILED",
      message: "Empty file",
    });
  }
  if (bytes.length > MAX_MEDIA_BYTES) {
    return json(413, {
      code: "MEDIA_UPLOAD_FAILED",
      message: "File exceeds the 25 MB limit",
    });
  }

  await getStorage().put(
    storedFile,
    bytes,
    request.headers.get("content-type") ?? String(storedFile.mimeType ?? ""),
  );

  return new Response(null, { status: 204 });
};

const handleDownload = async (request: Request, fileId: string, url: URL) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return json(405, { code: "METHOD_NOT_ALLOWED", message: "Use GET" });
  }

  if (!(await verifyMediaToken(readToken(url), fileId, "download"))) {
    return json(403, {
      code: "FORBIDDEN",
      message: "Invalid or expired download token",
    });
  }

  const storedFile = await loadFile(fileId);
  if (!storedFile || storedFile.deletedAt) {
    return json(404, { code: "NOT_FOUND", message: "File not found" });
  }

  if (storedFile.status !== "uploaded") {
    return json(409, {
      code: "NOT_FOUND",
      message: "File is not ready",
    });
  }

  const bytes = await getStorage().get(storedFile);
  const headers = {
    "content-type": String(storedFile.mimeType ?? "application/octet-stream"),
    "content-length": String(bytes.length),
    "cache-control": "private, no-store",
    "x-content-type-options": "nosniff",
  };

  if (request.method === "HEAD") {
    return new Response(null, { headers });
  }

  return new Response(bytes as BodyInit, { headers });
};

const handler = async (request: Request) => {
  const url = new URL(request.url);
  const [route, rawId] = url.pathname.split("/").filter(Boolean);
  const fileId = rawId ? decodeURIComponent(rawId) : "";

  if (route === "upload") return await handleUpload(request, fileId, url);
  if (route === "files") return await handleDownload(request, fileId, url);

  return json(404, { code: "NOT_FOUND", message: "Route not found" });
};

let mediaServer: Deno.HttpServer | undefined;

export const startMediaServer = () => {
  if (mediaServer) return mediaServer;

  const port = Number(Deno.env.get("MEDIA_PORT") || 1406);

  mediaServer = Deno.serve({ port }, handler);
  console.log(`📸 Media server listening on http://localhost:${port}`);
  return mediaServer;
};
