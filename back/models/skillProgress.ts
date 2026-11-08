import { coreApp } from "../mod.ts";
import {
  array,
  date,
  defaulted,
  enums,
  number,
  object,
  optional,
  type RelationDataType,
  type RelationSortOrderType,
  string,
} from "lesan";
import { createUpdateAt } from "./utils/createUpdateAt.ts";
import { user_excludes } from "./excludes.ts";

export const mastery_state_array = [
  "unseen",
  "learning",
  "practicing",
  "competent",
  "mastered",
];

export const mastery_state_enums = enums(mastery_state_array);

export const skill_evidence = object({
  type: string(),
  refId: optional(string()),
  score: number(),
  at: date(),
});

export const skillProgress_pure = {
  state: defaulted(mastery_state_enums, "unseen"),
  confidence: defaulted(number(), 0),
  evidence: defaulted(array(skill_evidence), () => []),
  algorithmVersion: defaulted(string(), "1.0"),
  ...createUpdateAt,
};

export const skillProgress_relations = {
  user: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: false,
    excludes: user_excludes,
    relatedRelations: {
      skillProgresses: {
        type: "multiple" as RelationDataType,
        limit: 200,
        sort: { field: "updatedAt", order: "desc" as RelationSortOrderType },
      },
    },
  },
  skill: {
    schemaName: "skill",
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

export const skillProgresses = () =>
  coreApp.odm.newModel(
    "skillProgress",
    skillProgress_pure,
    skillProgress_relations,
  );
