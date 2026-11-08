import type { ActFn } from "lesan";
import { type FileProjection, requestFileUpload } from "@lib";
import { file } from "../../../mod.ts";

export const requestUploadFn: ActFn = async (body) => {
  const {
    set: { name, mimeType, size },
    get,
  } = body.details;

  const { file: created, upload } = await requestFileUpload(
    { name, mimeType, size },
  );

  const projection = (get as { file?: Record<string, unknown> } | undefined)
    ?.file;

  if (!projection) return { file: created, upload };

  const projected = await file.findOne({
    filters: { _id: created._id },
    projection: projection as unknown as FileProjection,
  });

  return { file: projected ?? created, upload };
};
