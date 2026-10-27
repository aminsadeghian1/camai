import type { ActFn } from "lesan";
import { compare } from "@da/bcrypt";
import { user } from "../../../mod.ts";
import { throwError } from "@lib";
import { issueSession } from "../../session/shared.ts";

export const loginFn: ActFn = async (body) => {
  const {
    set: { email, password, device },
  } = body.details;

  const foundedUser = await user.findOne({
    filters: { email },
    projection: {
      _id: 1,
      displayName: 1,
      email: 1,
      mobile: 1,
      password: 1,
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
    return throwError("UNAUTHORIZED: Invalid email or password");
  }

  const passwordIsCorrect = await compare(
    password,
    foundedUser.password as string,
  );

  if (!passwordIsCorrect) {
    return throwError("UNAUTHORIZED: Invalid email or password");
  }

  if (foundedUser.status !== "active") {
    return throwError("FORBIDDEN: Account is not active");
  }

  delete foundedUser.password;

  return {
    ...await issueSession(foundedUser, device),
    user: foundedUser,
  };
};
