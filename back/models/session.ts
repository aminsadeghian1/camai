import { coreApp } from "../mod.ts";
import {
  date,
  optional,
  type RelationDataType,
  type RelationSortOrderType,
  string,
} from "lesan";
import { createUpdateAt } from "./utils/createUpdateAt.ts";
import { user_excludes } from "./excludes.ts";

export const session_pure = {
  refreshTokenHash: string(),
  device: optional(string()),
  expiresAt: date(),
  revokedAt: optional(date()),
  ...createUpdateAt,
};

export const session_relations = {
  user: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: false,
    excludes: user_excludes,
    relatedRelations: {
      sessions: {
        type: "multiple" as RelationDataType,
        limit: 20,
        sort: {
          field: "_id",
          order: "desc" as RelationSortOrderType,
        },
      },
    },
  },
};

export const sessions = () =>
  coreApp.odm.newModel("session", session_pure, session_relations, {
    excludes: ["refreshTokenHash"],
  });
