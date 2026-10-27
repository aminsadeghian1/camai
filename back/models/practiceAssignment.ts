import { coreApp } from "../mod.ts";
import {
  array,
  date,
  defaulted,
  enums,
  optional,
  type RelationDataType,
  type RelationSortOrderType,
  string,
} from "lesan";
import { createUpdateAt } from "./utils/createUpdateAt.ts";

export const practice_status_array = [
  "assigned",
  "inProgress",
  "submitted",
  "reviewed",
  "failed",
];

export const practice_status_enums = enums(practice_status_array);

export const practiceAssignment_pure = {
  title: string(),
  objective: string(),
  constraints: defaulted(array(string()), () => []),
  requirements: defaulted(array(string()), () => []),
  requiredConcept: optional(string()),
  status: defaulted(practice_status_enums, "assigned"),
  dueAt: optional(date()),
  ...createUpdateAt,
};

export const practiceAssignment_relations = {
  user: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: false,
    relatedRelations: {
      practiceAssignments: {
        type: "multiple" as RelationDataType,
        limit: 200,
        sort: { field: "createdAt", order: "desc" as RelationSortOrderType },
      },
    },
  },
  lesson: {
    schemaName: "lesson",
    type: "single" as RelationDataType,
    optional: true,
    relatedRelations: {},
  },
  skill: {
    schemaName: "skill",
    type: "single" as RelationDataType,
    optional: true,
    relatedRelations: {},
  },
  sourceLab: {
    schemaName: "lab",
    type: "single" as RelationDataType,
    optional: true,
    relatedRelations: {},
  },
};

export const practiceAssignments = () =>
  coreApp.odm.newModel(
    "practiceAssignment",
    practiceAssignment_pure,
    practiceAssignment_relations,
  );
