import { type Document, ObjectId } from "lesan";
import { session } from "../../mod.ts";
import {
  createAccessToken,
  createRefreshSecret,
  hashRefreshSecret,
  refreshExpiryDate,
  throwError,
} from "@lib";

export const issueSession = async (userDoc: Document, device?: string) => {
  const secret = createRefreshSecret();

  const createdSession = await session.insertOne({
    doc: {
      refreshTokenHash: await hashRefreshSecret(secret),
      device,
      expiresAt: refreshExpiryDate(),
    },
    relations: {
      user: {
        _ids: new ObjectId(String(userDoc._id)),
      },
    },
    projection: { _id: 1 },
  });

  if (!createdSession) {
    return throwError("UNAUTHORIZED: Could not create session");
  }

  return {
    token: await createAccessToken(userDoc),
    refreshToken: `${createdSession._id}.${secret}`,
  };
};

export const parseRefreshToken = (refreshToken: string) => {
  const separator = refreshToken.indexOf(".");

  if (separator < 1) {
    return throwError("UNAUTHORIZED: Invalid refresh token");
  }

  const sessionId = refreshToken.slice(0, separator);
  const secret = refreshToken.slice(separator + 1);

  if (!secret) {
    return throwError("UNAUTHORIZED: Invalid refresh token");
  }

  return { sessionId, secret };
};
