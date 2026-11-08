import { type ActFn } from "lesan";
import { createLabAttempt, getAuth } from "@lib";

export const addFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user } = await getAuth();

  return await createLabAttempt({
    userId: String(user._id),
    labId: String(set.labId),
    challengeId: set.challengeId ? String(set.challengeId) : undefined,
    operationId: set.operationId,
    controls: (set.controls ?? {}) as Record<string, unknown>,
    prediction: set.prediction as Record<string, unknown> | undefined,
    projection: get,
  });
};
