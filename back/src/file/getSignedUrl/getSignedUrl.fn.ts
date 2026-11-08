import type { ActFn } from "lesan";
import { signedFileUrl } from "@lib";

export const getSignedUrlFn: ActFn = async (body) => {
  const {
    set: { _id, ttlSeconds },
  } = body.details;

  return await signedFileUrl(
    String(_id),
    typeof ttlSeconds === "number" ? ttlSeconds : 900,
  );
};
