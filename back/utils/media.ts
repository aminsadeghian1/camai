import { throwError } from "./throwError.ts";

export const MAX_MEDIA_BYTES = 25 * 1024 * 1024;

export type MediaKind = "image" | "video" | "docs" | "other";

export type DetectedMedia = {
  mimeType: string;
  type: MediaKind;
  extension: string;
  width?: number;
  height?: number;
  capturedAt?: string;
  exif?: Record<string, unknown>;
};

const startsWith = (bytes: Uint8Array, signature: number[]): boolean =>
  signature.every((value, index) => bytes[index] === value);

const readUint16 = (bytes: Uint8Array, offset: number): number =>
  (bytes[offset] << 8) | bytes[offset + 1];

const readUint32 = (bytes: Uint8Array, offset: number): number =>
  ((bytes[offset] << 24) | (bytes[offset + 1] << 16) |
    (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;

const ascii = (bytes: Uint8Array, offset: number, length: number): string =>
  String.fromCharCode(...bytes.slice(offset, offset + length));

const detectJpeg = (bytes: Uint8Array): DetectedMedia => {
  let offset = 2;
  let width: number | undefined;
  let height: number | undefined;
  let capturedAt: string | undefined;
  let exif: Record<string, unknown> | undefined;

  while (offset + 4 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset++;
      continue;
    }

    const marker = bytes[offset + 1];
    const length = readUint16(bytes, offset + 2);
    const segmentStart = offset + 4;

    if (marker === 0xe1 && ascii(bytes, segmentStart, 4) === "Exif") {
      const parsed = parseExif(
        bytes.slice(segmentStart + 6, offset + 2 + length),
      );
      width = parsed.width ?? width;
      height = parsed.height ?? height;
      capturedAt = parsed.capturedAt ?? capturedAt;
      exif = parsed.exif;
    }

    if (marker >= 0xc0 && marker <= 0xc3 && segmentStart + 4 < bytes.length) {
      height = readUint16(bytes, segmentStart + 1);
      width = readUint16(bytes, segmentStart + 3);
    }

    offset += 2 + length;
  }

  return {
    mimeType: "image/jpeg",
    type: "image",
    extension: "jpg",
    width,
    height,
    capturedAt,
    exif,
  };
};

const parseExif = (
  tiff: Uint8Array,
): {
  width?: number;
  height?: number;
  capturedAt?: string;
  exif?: Record<string, unknown>;
} => {
  if (tiff.length < 8) return {};

  const littleEndian = tiff[0] === 0x49 && tiff[1] === 0x49;
  const u16 = (offset: number) =>
    littleEndian
      ? tiff[offset] | (tiff[offset + 1] << 8)
      : (tiff[offset] << 8) | tiff[offset + 1];
  const u32 = (offset: number) =>
    littleEndian
      ? (tiff[offset] | (tiff[offset + 1] << 8) | (tiff[offset + 2] << 16) |
        (tiff[offset + 3] << 24)) >>> 0
      : ((tiff[offset] << 24) | (tiff[offset + 1] << 16) |
        (tiff[offset + 2] << 8) | tiff[offset + 3]) >>> 0;

  const readAscii = (offset: number, count: number) =>
    ascii(tiff, offset, count).replace(/\0.*$/, "").trim();

  const readTag = (ifdOffset: number, tag: number) => {
    if (ifdOffset + 2 > tiff.length) return undefined;
    const count = u16(ifdOffset);
    for (let index = 0; index < count; index++) {
      const entry = ifdOffset + 2 + index * 12;
      if (entry + 12 > tiff.length) return undefined;
      if (u16(entry) !== tag) continue;
      const type = u16(entry + 2);
      const valueCount = u32(entry + 4);
      const valueOffset = u32(entry + 8);
      const absolute = valueCount <= 4 ? entry + 8 : valueOffset;
      if (type === 2) return readAscii(absolute, valueCount);
      if (type === 3) return u16(absolute);
      if (type === 4) return u32(absolute);
    }
    return undefined;
  };

  const ifd0 = u32(4);
  const width = readTag(ifd0, 0x0100) as number | undefined;
  const height = readTag(ifd0, 0x0101) as number | undefined;
  const exifPointer = readTag(ifd0, 0x8769) as number | undefined;
  const capturedAt = exifPointer
    ? readTag(exifPointer, 0x9003) as string | undefined
    : readTag(ifd0, 0x0132) as string | undefined;

  return {
    width,
    height,
    capturedAt,
    exif: capturedAt ? { capturedAt } : undefined,
  };
};

const detectPng = (bytes: Uint8Array): DetectedMedia => ({
  mimeType: "image/png",
  type: "image",
  extension: "png",
  width: readUint32(bytes, 16),
  height: readUint32(bytes, 20),
});

const detectWebp = (bytes: Uint8Array): DetectedMedia => {
  const chunk = ascii(bytes, 12, 4);
  let width: number | undefined;
  let height: number | undefined;

  if (chunk === "VP8X" && bytes.length > 30) {
    width = 1 + (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16));
    height = 1 + (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16));
  }

  return {
    mimeType: "image/webp",
    type: "image",
    extension: "webp",
    width,
    height,
  };
};

export const detectMedia = (bytes: Uint8Array): DetectedMedia => {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return detectJpeg(bytes);
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47])) return detectPng(bytes);
  if (
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    ascii(bytes, 8, 4) === "WEBP"
  ) {
    return detectWebp(bytes);
  }
  if (startsWith(bytes, [0x47, 0x49, 0x46, 0x38])) {
    return { mimeType: "image/gif", type: "image", extension: "gif" };
  }
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46])) {
    return { mimeType: "application/pdf", type: "docs", extension: "pdf" };
  }
  if (ascii(bytes, 4, 4) === "ftyp") {
    return { mimeType: "video/mp4", type: "video", extension: "mp4" };
  }

  return throwError("MEDIA_UPLOAD_FAILED: Unsupported media format");
};

export const verifyDeclaredMime = (
  detected: DetectedMedia,
  declaredMime: string,
): void => {
  if (declaredMime && detected.mimeType !== declaredMime) {
    throwError("MEDIA_UPLOAD_FAILED: File content does not match MIME type");
  }
};

export const validateMediaSize = (size: number): void => {
  if (size <= 0) throwError("MEDIA_UPLOAD_FAILED: Empty file");
  if (size > MAX_MEDIA_BYTES) {
    throwError("MEDIA_UPLOAD_FAILED: File exceeds the 25 MB limit");
  }
};

export const mediaKindForMime = (mimeType: string): MediaKind => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (
    mimeType === "application/pdf" ||
    mimeType.startsWith("text/") ||
    mimeType.includes("document") ||
    mimeType.includes("word") ||
    mimeType.includes("sheet")
  ) {
    return "docs";
  }
  return "other";
};

export const safeMetadata = (detected: DetectedMedia) => ({
  width: detected.width,
  height: detected.height,
  capturedAt: detected.capturedAt,
  exif: detected.exif,
  magicVerified: true,
});
