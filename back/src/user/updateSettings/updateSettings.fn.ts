import { type ActFn, ObjectId } from "lesan";
import { user } from "../../../mod.ts";
import {
  getAuth,
  sanitizeUserProjection,
  sanitizeUserResponse,
  throwError,
} from "@lib";

type UserSettings = {
  language?: string;
  notifications?: Record<string, unknown>;
  privacy?: Record<string, unknown>;
};

const mergeSettings = (
  current: UserSettings | undefined,
  incoming: UserSettings | undefined,
): UserSettings => ({
  ...(current ?? {}),
  ...(incoming ?? {}),
  notifications: {
    ...(current?.notifications ?? {}),
    ...(incoming?.notifications ?? {}),
  },
  privacy: {
    ...(current?.privacy ?? {}),
    ...(incoming?.privacy ?? {}),
  },
});

export const updateSettingsFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user: authenticatedUser } = await getAuth();

  const foundedUser = await user.findOne({
    filters: { _id: new ObjectId(String(authenticatedUser._id)) },
    projection: { _id: 1, settings: 1 },
  });

  if (!foundedUser) return throwError("NOT_FOUND: User not found");

  const update: Record<string, unknown> = {
    settings: mergeSettings(
      foundedUser.settings as UserSettings | undefined,
      set.settings as UserSettings | undefined,
    ),
    updatedAt: new Date(),
  };

  const updated = await user.findOneAndUpdate({
    filter: { _id: new ObjectId(String(authenticatedUser._id)) },
    update: { $set: update },
    projection: sanitizeUserProjection(get),
  });

  if (!updated) return throwError("NOT_FOUND: User not found");

  return sanitizeUserResponse(updated);
};
