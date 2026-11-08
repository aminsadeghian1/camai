import { assertEquals, assertThrows } from "@std/assert";
import { AppError, isAppError } from "./throwError.ts";
import { detectMedia, safeMetadata, verifyDeclaredMime } from "./media.ts";

const captured = (fn: () => unknown): AppError => {
  try {
    fn();
  } catch (error) {
    if (isAppError(error)) return error;
    throw error;
  }
  throw new Error("Expected function to throw");
};

const pngHeader = (width: number, height: number): Uint8Array => {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return bytes;
};

Deno.test("detects JPEG, PNG, GIF and PDF signatures", () => {
  assertEquals(
    detectMedia(new Uint8Array([0xff, 0xd8, 0xff])).mimeType,
    "image/jpeg",
  );
  assertEquals(
    detectMedia(pngHeader(640, 480)),
    {
      mimeType: "image/png",
      type: "image",
      extension: "png",
      width: 640,
      height: 480,
    },
  );
  assertEquals(
    detectMedia(new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])).mimeType,
    "image/gif",
  );
  assertEquals(
    detectMedia(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])).mimeType,
    "application/pdf",
  );
});

Deno.test("detects WebP and MP4 containers", () => {
  const webp = new Uint8Array(32);
  webp.set([0x52, 0x49, 0x46, 0x46]);
  webp.set([0x57, 0x45, 0x42, 0x50], 8);
  webp.set([0x56, 0x50, 0x38, 0x58], 12);
  assertEquals(detectMedia(webp).mimeType, "image/webp");

  const mp4 = new Uint8Array(12);
  mp4.set([0x66, 0x74, 0x79, 0x70], 4);
  assertEquals(detectMedia(mp4).mimeType, "video/mp4");
});

Deno.test("rejects unsupported media", () => {
  const error = captured(() => detectMedia(new Uint8Array([1, 2, 3, 4])));
  assertEquals(error.code, "MEDIA_UPLOAD_FAILED");
});

Deno.test("declared MIME must match magic bytes", () => {
  assertThrows(() =>
    verifyDeclaredMime(
      { mimeType: "image/png", type: "image", extension: "png" },
      "image/jpeg",
    )
  );
  verifyDeclaredMime(
    { mimeType: "image/png", type: "image", extension: "png" },
    "image/png",
  );
  verifyDeclaredMime(
    { mimeType: "image/png", type: "image", extension: "png" },
    "",
  );
});

Deno.test("safe metadata never exposes raw bytes", () => {
  const metadata = safeMetadata({
    mimeType: "image/png",
    type: "image",
    extension: "png",
    width: 1,
    height: 2,
    exif: { capturedAt: "2026-01-01" },
  });
  assertEquals(metadata.magicVerified, true);
  assertEquals(metadata.width, 1);
  assertEquals(metadata.exif, { capturedAt: "2026-01-01" });
});
