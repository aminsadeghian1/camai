import { type ActFn, ObjectId } from "lesan";
import { coreApp, session, user } from "../../../mod.ts";
import { throwError, verifyRefreshSecret } from "@lib";
import { issueSession, parseRefreshToken } from "../shared.ts";

export const refreshFn: ActFn = async (body) => {
  const {
    set: { refreshToken, device },
  } = body.details;

  const { sessionId, secret } = parseRefreshToken(refreshToken);

  const existingSession = await session.findOne({
    filters: { _id: new ObjectId(sessionId) },
    projection: {
      _id: 1,
      refreshTokenHash: 1,
      expiresAt: 1,
      revokedAt: 1,
      user: { _id: 1 },
    },
  });

  if (!existingSession) {
    return throwError("UNAUTHORIZED: Invalid refresh token");
  }

  if (existingSession.revokedAt) {
    const revokedOwner = existingSession.user as { _id?: unknown } | undefined;

    if (revokedOwner?._id) {
      await coreApp.odm.getCollection("session").updateMany(
        {
          "user._id": new ObjectId(String(revokedOwner._id)),
          revokedAt: { $exists: false },
        },
        { $set: { revokedAt: new Date(), updatedAt: new Date() } },
      );
    }

    return throwError(
      "UNAUTHORIZED: Refresh token reuse detected; all sessions revoked",
    );
  }

  const expiresAt = existingSession.expiresAt instanceof Date
    ? existingSession.expiresAt
    : new Date(String(existingSession.expiresAt));

  if (expiresAt.getTime() <= Date.now()) {
    return throwError("UNAUTHORIZED: Refresh token has expired");
  }

  const isSecretValid = await verifyRefreshSecret(
    secret,
    existingSession.refreshTokenHash as string,
  );

  if (!isSecretValid) {
    return throwError("UNAUTHORIZED: Invalid refresh token");
  }

  const sessionUser = existingSession.user as { _id?: unknown } | undefined;

  if (!sessionUser?._id) {
    return throwError("UNAUTHORIZED: Session owner not found");
  }

  const foundedUser = await user.findOne({
    filters: { _id: new ObjectId(String(sessionUser._id)) },
    projection: {
      _id: 1,
      displayName: 1,
      email: 1,
      mobile: 1,
      is_verified: 1,
      status: 1,
      roles: 1,
      settings: 1,
      avatar: { _id: 1, name: 1, mimeType: 1, type: 1 },
      createdAt: 1,
      updatedAt: 1,
    },
  });

  if (!foundedUser) {
    return throwError("UNAUTHORIZED: User not found");
  }

  if (foundedUser.status !== "active") {
    return throwError("FORBIDDEN: Account is not active");
  }

  await session.findOneAndUpdate({
    filter: { _id: new ObjectId(sessionId) },
    update: {
      $set: {
        revokedAt: new Date(),
        updatedAt: new Date(),
      },
    },
    projection: { _id: 1 },
  });

  return {
    ...await issueSession(foundedUser, device),
    user: foundedUser,
  };
};
