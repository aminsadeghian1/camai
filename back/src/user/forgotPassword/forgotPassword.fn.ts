import type { ActFn } from "lesan";
import { user } from "../../../mod.ts";
import {
  createPasswordResetToken,
  hashRefreshSecret,
  parsePasswordResetToken,
  throwError,
} from "@lib";

const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;
const ENV = Deno.env.get("ENV") || "development";

export const forgotPasswordFn: ActFn = async (body) => {
  const {
    set: { email },
  } = body.details;

  const foundedUser = await user.findOne({
    filters: { email },
    projection: { _id: 1, status: 1 },
  });

  if (!foundedUser || foundedUser.status !== "active") {
    return { success: 1 };
  }

  const resetToken = createPasswordResetToken(foundedUser._id);
  const { secret } = parsePasswordResetToken(resetToken);

  if (!secret) {
    return throwError("INTERNAL: Could not create reset token");
  }

  await user.findOneAndUpdate({
    filter: { _id: foundedUser._id },
    update: {
      $set: {
        passwordResetTokenHash: await hashRefreshSecret(secret),
        passwordResetExpiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
        updatedAt: new Date(),
      },
    },
    projection: { _id: 1 },
  });

  return {
    success: 1,
    ...(ENV === "production" ? {} : { resetToken }),
  };
};
