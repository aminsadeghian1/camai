import { coreApp } from "../mod.ts";
import {
  object,
  type RelationDataType,
  string,
} from "lesan";
import { createUpdateAt } from "./utils/createUpdateAt.ts";

export const labEvent_pure = {
  operationId: string(),
  eventType: string(),
  payload: object(),
  ...createUpdateAt,
};

export const labEvent_relations = {
  attempt: {
    schemaName: "labAttempt",
    type: "single" as RelationDataType,
    optional: false,
    relatedRelations: {},
  },
};

export const labEvents = () =>
  coreApp.odm.newModel("labEvent", labEvent_pure, labEvent_relations);
