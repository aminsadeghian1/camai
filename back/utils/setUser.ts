import { ObjectId } from "lesan";
import { coreApp, user } from "../mod.ts";
import type { MyContext } from "./context.ts";
import { throwError } from "./throwError.ts";

export const setUser = async () => {
  const ctx = coreApp.contextFns.getContextModel() as MyContext;
  const tokenUser = ctx.user;

  if (!tokenUser || !tokenUser._id) {
    throwError("UNAUTHORIZED: Invalid or missing token data");
  }

  const userPureProjection = coreApp.schemas.createProjection("user", "Pure");

  const foundedUser = await user.findOne({
    filters: { _id: new ObjectId(tokenUser._id) },
    projection: {
      ...userPureProjection,
      avatar: { _id: 1, name: 1, mimeType: 1, type: 1 },
    },
  });

  if (!foundedUser) {
    throwError("UNAUTHORIZED: User not found");
  }

  delete (foundedUser as Record<string, unknown>).password;

  if ((foundedUser as { status?: string }).status !== "active") {
    throwError("FORBIDDEN: Account is not active");
  }

  coreApp.contextFns.setContext({ user: foundedUser });
};
