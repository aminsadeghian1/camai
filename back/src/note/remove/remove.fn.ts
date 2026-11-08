import { type ActFn } from "lesan";
import { getAuth, removeUserNote } from "@lib";

export const removeFn: ActFn = async (body) => {
  const { set } = body.details;
  const { user } = await getAuth();

  return await removeUserNote(String(user._id), String(set._id));
};
