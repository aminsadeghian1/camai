import type { ActFn } from "lesan";
import { completeFileUpload, type FileProjection } from "@lib";

export const completeUploadFn: ActFn = async (body) => {
  const { set, get } = body.details;

  return await completeFileUpload(
    String(set._id),
    get as unknown as FileProjection,
  );
};
