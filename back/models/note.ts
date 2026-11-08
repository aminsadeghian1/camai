import { coreApp } from "../mod.ts";
import {
  boolean,
  date,
  defaulted,
  enums,
  optional,
  type RelationDataType,
  type RelationSortOrderType,
  string,
} from "lesan";
import { createUpdateAt } from "./utils/createUpdateAt.ts";
import { user_excludes } from "./excludes.ts";

export const note_target_type_array = [
  "lesson",
  "lab",
  "practice",
  "photo",
  "general",
];

export const note_target_type_enums = enums(note_target_type_array);

export const note_pure = {
  targetType: note_target_type_enums,
  targetId: optional(string()),
  body: string(),
  isPinned: defaulted(boolean(), false),
  operationId: string(),
  deletedAt: optional(date()),
  ...createUpdateAt,
};

export const note_relations = {
  user: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: false,
    excludes: user_excludes,
    relatedRelations: {
      notes: {
        type: "multiple" as RelationDataType,
        limit: 200,
        sort: { field: "updatedAt", order: "desc" as RelationSortOrderType },
      },
    },
  },
};

export const notes = () =>
  coreApp.odm.newModel("note", note_pure, note_relations);
