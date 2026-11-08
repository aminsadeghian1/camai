import type { ActFn } from "lesan";
import { ObjectId } from "lesan";
import { hash } from "@da/bcrypt";
import { coreApp, user } from "../../../mod.ts";
import { parsePasswordResetToken, throwError, verifyRefreshSecret } from "@lib";

export const resetPasswordFn: ActFn = async (body) => {
  const {
    set: { token, password },
  } = body.details;

  const { userId, secret } = parsePasswordResetToken(token);

  if (!ObjectId.isValid(userId) || !secret) {
    return throwError("UNAUTHORIZED: Invalid or expired reset token");
  }

  const foundedUser = await user.findOne({
    filters: { _id: new ObjectId(userId) },
    projection: {
      _id: 1,
      status: 1,
      passwordResetTokenHash: 1,
      passwordResetExpiresAt: 1,
    },
  });

  if (!foundedUser?.passwordResetTokenHash) {
    return throwError("UNAUTHORIZED: Invalid or expired reset token");
  }

  const expiresAt = foundedUser.passwordResetExpiresAt instanceof Date
    ? foundedUser.passwordResetExpiresAt
    : new Date(String(foundedUser.passwordResetExpiresAt));

  if (
    !Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()
  ) {
    return throwError("UNAUTHORIZED: Invalid or expired reset token");
  }

  const valid = await verifyRefreshSecret(
    secret,
    String(foundedUser.passwordResetTokenHash),
  );

  if (!valid) {
    return throwError("UNAUTHORIZED: Invalid or expired reset token");
  }

  await user.findOneAndUpdate({
    filter: { _id: foundedUser._id },
    update: {
      $set: {
        password: await hash(password),
        updatedAt: new Date(),
      },
      $unset: {
        passwordResetTokenHash: "",
        passwordResetExpiresAt: "",
      },
    },
    projection: { _id: 1 },
  });

  await coreApp.odm.getCollection("session").updateMany(
    { "user._id": foundedUser._id, revokedAt: { $exists: false } },
    { $set: { revokedAt: new Date(), updatedAt: new Date() } },
  );

  return { success: 1 };
};
