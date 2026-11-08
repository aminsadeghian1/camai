import { type ActFn } from "lesan";
import { getAuth, updateUserNote } from "@lib";

export const updateFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user } = await getAuth();

  return await updateUserNote(
    String(user._id),
    {
      _id: String(set._id),
      body: set.body,
      isPinned: set.isPinned,
    },
    get,
  );
};
