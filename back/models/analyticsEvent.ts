import { coreApp } from "../mod.ts";
import {
  object,
  optional,
  type RelationDataType,
  string,
} from "lesan";
import { createUpdateAt } from "./utils/createUpdateAt.ts";

export const analyticsEvent_pure = {
  sessionId: optional(string()),
  eventType: string(),
  payload: object(),
  operationId: optional(string()),
  ...createUpdateAt,
};

export const analyticsEvent_relations = {
  user: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: true,
    relatedRelations: {},
  },
};

export const analyticsEvents = () =>
  coreApp.odm.newModel(
    "analyticsEvent",
    analyticsEvent_pure,
    analyticsEvent_relations,
  );
