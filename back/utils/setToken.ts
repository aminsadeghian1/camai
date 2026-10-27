import * as jwt from "djwt";
import { coreApp } from "../mod.ts";
import { jwtTokenKey } from "./tokens.ts";
import { throwError } from "./throwError.ts";

export const setTokens = async () => {
  const { Headers } = coreApp.contextFns.getContextModel();
  const authorization = Headers.get("authorization") ??
    Headers.get("Authorization");
  const token = authorization?.toLowerCase().startsWith("bearer ")
    ? authorization.slice(7)
    : Headers.get("token");

  if (!token) {
    return throwError("UNAUTHORIZED: Missing access token");
  }

  try {
    const verifiedToken = await jwt.verify(token, jwtTokenKey);
    coreApp.contextFns.setContext({ user: verifiedToken });
  } catch (_error) {
    throwError("UNAUTHORIZED: Invalid or expired token");
  }
};
