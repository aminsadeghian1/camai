import { coreApp } from "../mod.ts";
import {
  number,
  object,
  type RelationDataType,
  type RelationSortOrderType,
} from "lesan";
import { createUpdateAt } from "./utils/createUpdateAt.ts";

export const labResult_pure = {
  score: number(),
  metrics: object(),
  ...createUpdateAt,
};

export const labResult_relations = {
  attempt: {
    schemaName: "labAttempt",
    type: "single" as RelationDataType,
    optional: false,
    relatedRelations: {
      results: {
        type: "multiple" as RelationDataType,
        limit: 20,
        sort: { field: "createdAt", order: "desc" as RelationSortOrderType },
      },
    },
  },
};

export const labResults = () =>
  coreApp.odm.newModel("labResult", labResult_pure, labResult_relations);
