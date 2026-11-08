import type { ActFn } from "lesan";
import { signedReviewMediaUrl } from "@lib";

export const getReviewMediaUrlFn: ActFn = async (body) => {
  const {
    set: { _id, ttlSeconds },
  } = body.details;

  return await signedReviewMediaUrl(
    String(_id),
    typeof ttlSeconds === "number" ? ttlSeconds : 900,
  );
};
