import { type ActFn, ObjectId } from "lesan";
import { coreApp, session } from "../../../mod.ts";
import { type MyContext, throwError } from "@lib";
import { parseRefreshToken } from "../shared.ts";

export const logoutFn: ActFn = async (body) => {
  const {
    set: { refreshToken },
  } = body.details;

  const context = coreApp.contextFns.getContextModel() as MyContext;
  const { sessionId } = parseRefreshToken(refreshToken);

  const existingSession = await session.findOne({
    filters: { _id: new ObjectId(sessionId) },
    projection: {
      _id: 1,
      user: { _id: 1 },
    },
  });

  if (!existingSession) {
    return throwError("NOT_FOUND: Session not found");
  }

  const owner = existingSession.user as { _id?: unknown } | undefined;

  if (!owner?._id || String(owner._id) !== String(context.user._id)) {
    return throwError("FORBIDDEN: You cannot revoke this session");
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

  return { success: 1 };
};
