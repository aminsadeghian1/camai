import type { ActFn } from "lesan";
import { hash } from "@da/bcrypt";
import { user } from "../../../mod.ts";
import { sanitizeUserProjection, sanitizeUserResponse, throwError } from "@lib";

export const registerFn: ActFn = async (body) => {
  const {
    set: { displayName, email, password, mobile },
    get,
  } = body.details;

  const foundedUserWithEmail = await user.findOne({
    filters: { email },
  });

  if (foundedUserWithEmail) {
    return throwError("VALIDATION_FAILED: Email is already registered");
  }

  const registeredUser = await user.insertOne({
    doc: {
      displayName,
      email,
      mobile,
      password: await hash(password),
      is_verified: false,
      status: "active",
      roles: [{ roleId: crypto.randomUUID(), name: "Learner" as const }],
      settings: {
        language: "en",
        notifications: { push: true, email: true },
        privacy: { aiProcessingConsent: false, analyticsConsent: true },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    projection: sanitizeUserProjection(get),
  });

  return sanitizeUserResponse(
    registeredUser ??
      throwError("VALIDATION_FAILED: User could not be created"),
  );
};
