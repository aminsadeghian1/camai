import { enums, number, object, optional, size, string } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { activeRoleMixin } from "@lib";

const flag = optional(enums([0, 1]));

export const requestUploadValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      name: size(string(), 1, 255),
      mimeType: size(string(), 1, 255),
      size: number(),
    }),
    get: optional(
      object({
        file: optional(selectStruct("file", 2)),
        upload: optional(
          object({
            uploadUrl: flag,
            method: flag,
            headers: flag,
            expiresIn: flag,
          }),
        ),
      }),
    ),
  });
