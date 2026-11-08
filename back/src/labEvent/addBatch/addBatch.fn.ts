import { type ActFn } from "lesan";
import { addLabEvents, getAuth } from "@lib";

export const addBatchFn: ActFn = async (body) => {
  const { set } = body.details;
  const { user } = await getAuth();

  return await addLabEvents({
    userId: String(user._id),
    attemptId: String(set.attemptId),
    events: set.events as {
      operationId: string;
      eventType: string;
      payload?: Record<string, unknown>;
    }[],
  });
};
