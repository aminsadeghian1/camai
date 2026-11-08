import { type ActFn } from "lesan";
import { createUserNote, getAuth } from "@lib";

export const addFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user } = await getAuth();

  return await createUserNote(
    String(user._id),
    {
      targetType: set.targetType,
      targetId: set.targetId,
      body: set.body,
      isPinned: set.isPinned,
      operationId: set.operationId,
    },
    get,
  );
};
