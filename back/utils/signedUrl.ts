const encoder = new TextEncoder();

const mediaSecret = Deno.env.get("MEDIA_SECRET");

if (!mediaSecret || encoder.encode(mediaSecret).length < 32) {
  throw new Error(
    "MEDIA_SECRET must be set and contain at least 32 bytes.",
  );
}

const key = await crypto.subtle.importKey(
  "raw",
  encoder.encode(mediaSecret),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign", "verify"],
);

const base64Url = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const fromBase64Url = (value: string): Uint8Array => {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
};

const sign = async (payload: string): Promise<string> => {
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload),
  );
  return base64Url(new Uint8Array(signature));
};

export type MediaAction = "upload" | "download";

export const createMediaToken = async (
  fileId: string,
  action: MediaAction,
  ttlSeconds = 900,
): Promise<string> => {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${fileId}.${action}.${expiresAt}`;
  return `${base64Url(encoder.encode(payload))}.${await sign(payload)}`;
};

export const verifyMediaToken = async (
  token: string,
  fileId: string,
  action: MediaAction,
): Promise<boolean> => {
  const [encoded, signature] = token.split(".");

  if (!encoded || !signature) return false;

  let payload: string;

  try {
    payload = new TextDecoder().decode(fromBase64Url(encoded));
  } catch {
    return false;
  }

  const [tokenFileId, tokenAction, expiresAtRaw] = payload.split(".");
  const expiresAt = Number(expiresAtRaw);

  if (
    tokenFileId !== fileId || tokenAction !== action ||
    !Number.isFinite(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)
  ) {
    return false;
  }

  const expected = await sign(payload);

  if (expected.length !== signature.length) return false;

  let mismatch = 0;
  for (let index = 0; index < expected.length; index++) {
    mismatch |= expected.charCodeAt(index) ^ signature.charCodeAt(index);
  }

  return mismatch === 0;
};
