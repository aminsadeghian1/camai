import * as jwt from "djwt";
import { compare, hash } from "@da/bcrypt";
import type { Document } from "lesan";

const secretKey = Deno.env.get("TOKEN_KEY") || "camai-dev-token-key";
const encoder = new TextEncoder();
const keyBuf = encoder.encode(secretKey);

export const jwtTokenKey = await crypto.subtle.importKey(
  "raw",
  keyBuf,
  { name: "HMAC", hash: "SHA-512" },
  true,
  ["sign", "verify"],
);

export const ACCESS_TOKEN_TTL_SECONDS = Number(
  Deno.env.get("ACCESS_TOKEN_TTL_SECONDS") || 900,
);

export const REFRESH_TOKEN_TTL_DAYS = Number(
  Deno.env.get("REFRESH_TOKEN_TTL_DAYS") || 30,
);

export const createAccessToken = (user: Document) =>
  jwt.create(
    { alg: "HS512", typ: "JWT" },
    {
      _id: user._id,
      email: user.email,
      exp: jwt.getNumericDate(ACCESS_TOKEN_TTL_SECONDS),
    },
    jwtTokenKey,
  );

export const createRefreshSecret = () =>
  `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, "");

export const hashRefreshSecret = (secret: string) => hash(secret);

export const verifyRefreshSecret = (secret: string, hashed: string) =>
  compare(secret, hashed);

export const refreshExpiryDate = () =>
  new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
