import { coreApp } from "../mod.ts";
import {
  defaulted,
  enums,
  optional,
  type RelationDataType,
  type RelationSortOrderType,
  string,
} from "lesan";
import { createUpdateAt } from "./utils/createUpdateAt.ts";
import { user_excludes } from "./excludes.ts";

export const recommendation_activity_array = [
  "lesson",
  "lab",
  "practice",
  "challenge",
  "review",
];

export const recommendation_activity_enums = enums(
  recommendation_activity_array,
);

export const recommendation_status_array = [
  "new",
  "shown",
  "dismissed",
  "done",
];

export const recommendation_status_enums = enums(
  recommendation_status_array,
);

export const recommendation_pure = {
  reasonCode: string(),
  activityType: recommendation_activity_enums,
  activityId: optional(string()),
  explanation: string(),
  status: defaulted(recommendation_status_enums, "new"),
  ...createUpdateAt,
};

export const recommendation_relations = {
  user: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: false,
    excludes: user_excludes,
    relatedRelations: {
      recommendations: {
        type: "multiple" as RelationDataType,
        limit: 100,
        sort: { field: "createdAt", order: "desc" as RelationSortOrderType },
      },
    },
  },
};

export const recommendations = () =>
  coreApp.odm.newModel(
    "recommendation",
    recommendation_pure,
    recommendation_relations,
  );
