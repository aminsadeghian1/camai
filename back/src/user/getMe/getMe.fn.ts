import { type ActFn, ObjectId } from "lesan";
import { coreApp, user } from "../../../mod.ts";
import {
  type MyContext,
  sanitizeUserProjection,
  sanitizeUserResponse,
  throwError,
} from "@lib";

export const getMeFn: ActFn = async (body) => {
  const context = coreApp.contextFns.getContextModel() as MyContext;
  const _id = context.user._id;
  const { get } = body.details;

  const foundedUser = await user
    .aggregation({
      pipeline: [{ $match: { _id: new ObjectId(String(_id)) } }],
      projection: sanitizeUserProjection(get),
    })
    .toArray();

  if (foundedUser.length < 1) {
    throwError("NOT_FOUND: User not found");
  }

  return sanitizeUserResponse(foundedUser[0]);
};
