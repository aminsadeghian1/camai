import { coreApp } from "../mod.ts";
import {
  number,
  object,
  optional,
  type RelationDataType,
  type RelationSortOrderType,
  string,
} from "lesan";
import { contentCommon } from "./content.ts";

export const labChallenge_pure = {
  title: string(),
  description: optional(string()),
  rules: object({
    prompt: optional(string()),
    target: optional(object()),
    tolerance: optional(number()),
    passScore: optional(number()),
  }),
  ...contentCommon,
};

export const labChallenge_relations = {
  lab: {
    schemaName: "lab",
    type: "single" as RelationDataType,
    optional: false,
    relatedRelations: {
      challenges: {
        type: "multiple" as RelationDataType,
        limit: 20,
        sort: { field: "_id", order: "desc" as RelationSortOrderType },
      },
    },
  },
};

export const labChallenges = () =>
  coreApp.odm.newModel("labChallenge", labChallenge_pure, labChallenge_relations);
