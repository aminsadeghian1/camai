import { coreApp } from "../mod.ts";
import {
  date,
  enums,
  optional,
  type RelationDataType,
  type RelationSortOrderType,
  string,
} from "lesan";
import { createUpdateAt } from "./utils/createUpdateAt.ts";
import { user_excludes } from "./excludes.ts";

export const notification_type_array = [
  "continueLearning",
  "practiceReminder",
  "aiReviewReady",
  "challengeResult",
  "achievementUnlocked",
  "newCourse",
  "system",
];

export const notification_type_enums = enums(notification_type_array);

export const notification_pure = {
  type: notification_type_enums,
  title: string(),
  body: string(),
  readAt: optional(date()),
  scheduledAt: optional(date()),
  dispatchedAt: optional(date()),
  dedupeKey: optional(string()),
  ...createUpdateAt,
};

export const notification_relations = {
  user: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: false,
    excludes: user_excludes,
    relatedRelations: {
      notifications: {
        type: "multiple" as RelationDataType,
        limit: 200,
        sort: { field: "createdAt", order: "desc" as RelationSortOrderType },
      },
    },
  },
};

export const notifications = () =>
  coreApp.odm.newModel(
    "notification",
    notification_pure,
    notification_relations,
  );
