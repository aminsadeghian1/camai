import { coreApp } from "../mod.ts";
import {
  date,
  defaulted,
  number,
  object,
  optional,
  type RelationDataType,
  type RelationSortOrderType,
  string,
} from "lesan";
import { createUpdateAt } from "./utils/createUpdateAt.ts";
import { user_excludes } from "./excludes.ts";

export const labAttempt_pure = {
  labVersion: defaulted(number(), 1),
  sceneId: optional(string()),
  controls: object(),
  derivedMetrics: defaulted(object(), () => ({})),
  prediction: optional(object()),
  challengeResult: optional(object()),
  startedAt: defaulted(date(), () => new Date()),
  completedAt: optional(date()),
  operationId: string(),
  ...createUpdateAt,
};

export const labAttempt_relations = {
  user: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: false,
    excludes: user_excludes,
    relatedRelations: {
      labAttempts: {
        type: "multiple" as RelationDataType,
        limit: 200,
        sort: { field: "createdAt", order: "desc" as RelationSortOrderType },
      },
    },
  },
  lab: {
    schemaName: "lab",
    type: "single" as RelationDataType,
    optional: false,
    relatedRelations: {
      attempts: {
        type: "multiple" as RelationDataType,
        limit: 200,
        sort: { field: "createdAt", order: "desc" as RelationSortOrderType },
      },
    },
  },
  challenge: {
    schemaName: "labChallenge",
    type: "single" as RelationDataType,
    optional: true,
    relatedRelations: {},
  },
};

export const labAttempts = () =>
  coreApp.odm.newModel("labAttempt", labAttempt_pure, labAttempt_relations);
