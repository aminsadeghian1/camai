import { coreApp } from "../mod.ts";
import {
  boolean,
  date,
  defaulted,
  enums,
  number,
  object,
  optional,
  type RelationDataType,
  type RelationSortOrderType,
  string,
} from "lesan";
import { createUpdateAt } from "./utils/createUpdateAt.ts";
import { user_excludes } from "./excludes.ts";

export const file_type_array = ["image", "video", "docs", "other"];

export const file_type_enums = enums(file_type_array);

export const file_status_array = ["pending", "uploaded", "failed"];

export const file_status_enums = enums(file_status_array);

export const file_pure = {
  name: string(),
  mimeType: string(),
  size: number(),
  type: defaulted(file_type_enums, "other"),
  storageKey: optional(string()),
  metadata: defaulted(
    object({
      width: optional(number()),
      height: optional(number()),
      capturedAt: optional(string()),
      exif: optional(object()),
      magicVerified: optional(boolean()),
    }),
    () => ({}),
  ),
  status: defaulted(file_status_enums, "pending"),
  deletedAt: optional(date()),
  ...createUpdateAt,
};

export const file_relations = {
  owner: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: true,
    excludes: user_excludes,
    relatedRelations: {
      files: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
};

export const files = () =>
  coreApp.odm.newModel("file", file_pure, file_relations, {
    excludes: ["storageKey"],
  });
