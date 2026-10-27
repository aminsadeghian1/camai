import { coreApp } from "../mod.ts";
import {
  date,
  defaulted,
  enums,
  object,
  optional,
  type RelationDataType,
  type RelationSortOrderType,
  string,
} from "lesan";
import { createUpdateAt } from "./utils/createUpdateAt.ts";

export const submission_status_array = [
  "pending",
  "submitted",
  "reviewing",
  "reviewed",
  "failed",
];

export const submission_status_enums = enums(submission_status_array);

export const practiceSubmission_pure = {
  status: defaulted(submission_status_enums, "submitted"),
  operationId: string(),
  note: optional(string()),
  exif: optional(object()),
  submittedAt: defaulted(date(), () => new Date()),
  reviewedAt: optional(date()),
  ...createUpdateAt,
};

export const practiceSubmission_relations = {
  assignment: {
    schemaName: "practiceAssignment",
    type: "single" as RelationDataType,
    optional: false,
    relatedRelations: {
      submissions: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: { field: "createdAt", order: "desc" as RelationSortOrderType },
      },
    },
  },
  media: {
    schemaName: "file",
    type: "single" as RelationDataType,
    optional: false,
    relatedRelations: {},
  },
};

export const practiceSubmissions = () =>
  coreApp.odm.newModel(
    "practiceSubmission",
    practiceSubmission_pure,
    practiceSubmission_relations,
  );
