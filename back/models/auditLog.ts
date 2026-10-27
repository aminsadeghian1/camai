import { coreApp } from "../mod.ts";
import {
  defaulted,
  object,
  optional,
  type RelationDataType,
  string,
} from "lesan";
import { createUpdateAt } from "./utils/createUpdateAt.ts";

export const auditLog_pure = {
  action: string(),
  targetType: string(),
  targetId: optional(string()),
  metadata: defaulted(object(), () => ({})),
  ...createUpdateAt,
};

export const auditLog_relations = {
  adminUser: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: true,
    relatedRelations: {},
  },
};

export const auditLogs = () =>
  coreApp.odm.newModel("auditLog", auditLog_pure, auditLog_relations);
