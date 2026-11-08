import { type ActFn } from "lesan";
import { completeLabAttempt, getAuth } from "@lib";

export const completeFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user, activeRole } = await getAuth();

  return await completeLabAttempt({
    userId: String(user._id),
    attemptId: String(set._id),
    allowStaff: ["Manager", "Admin"].includes(activeRole.name),
    projection: get,
  });
};
