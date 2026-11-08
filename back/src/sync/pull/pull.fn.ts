import { type ActFn } from "lesan";
import { getAuth, pullChanges } from "@lib";

export const pullFn: ActFn = async (body) => {
  const { set } = body.details;
  const { user } = await getAuth();

  return await pullChanges(
    String(user._id),
    typeof set.cursor === "string" ? set.cursor : undefined,
    set.limit,
  );
};
