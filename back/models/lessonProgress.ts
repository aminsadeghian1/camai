import { coreApp } from "../mod.ts";
import {
  date,
  defaulted,
  enums,
  number,
  optional,
  type RelationDataType,
  type RelationSortOrderType,
} from "lesan";
import { createUpdateAt } from "./utils/createUpdateAt.ts";
import { user_excludes } from "./excludes.ts";

export const lesson_progress_status_array = [
  "notStarted",
  "inProgress",
  "completed",
];

export const lesson_progress_status_enums = enums(
  lesson_progress_status_array,
);

export const lessonProgress_pure = {
  version: defaulted(number(), 1),
  currentBlock: defaulted(number(), 0),
  status: defaulted(lesson_progress_status_enums, "inProgress"),
  completedAt: optional(date()),
  lastOpenedAt: optional(date()),
  ...createUpdateAt,
};

export const lessonProgress_relations = {
  user: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: false,
    excludes: user_excludes,
    relatedRelations: {
      lessonProgresses: {
        type: "multiple" as RelationDataType,
        limit: 200,
        sort: { field: "updatedAt", order: "desc" as RelationSortOrderType },
      },
    },
  },
  lesson: {
    schemaName: "lesson",
    type: "single" as RelationDataType,
    optional: false,
    relatedRelations: {
      progress: {
        type: "multiple" as RelationDataType,
        limit: 200,
        sort: { field: "updatedAt", order: "desc" as RelationSortOrderType },
      },
    },
  },
};

export const lessonProgresses = () =>
  coreApp.odm.newModel(
    "lessonProgress",
    lessonProgress_pure,
    lessonProgress_relations,
  );
