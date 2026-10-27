import { type ActFn, ObjectId } from "lesan";
import { coreApp, user } from "../../../mod.ts";
import { type MyContext, throwError } from "@lib";

export const getMeFn: ActFn = async (body) => {
  const context = coreApp.contextFns.getContextModel() as MyContext;
  const _id = context.user._id;
  const { get } = body.details;

  const foundedUser = await user
    .aggregation({
      pipeline: [{ $match: { _id: new ObjectId(String(_id)) } }],
      projection: get,
    })
    .toArray();

  if (foundedUser.length < 1) {
    throwError("NOT_FOUND: User not found");
  }

  return foundedUser[0];
};
