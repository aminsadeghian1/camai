import { coreApp } from "../mod.ts";
import {
  date,
  defaulted,
  enums,
  optional,
  type RelationDataType,
  type RelationSortOrderType,
} from "lesan";
import { createUpdateAt } from "./utils/createUpdateAt.ts";
import { user_excludes } from "./excludes.ts";

export const review_assignment_status_array = ["active", "revoked"];

export const review_assignment_status_enums = enums(
  review_assignment_status_array,
);

export const reviewAssignment_pure = {
  status: defaulted(review_assignment_status_enums, "active"),
  assignedAt: defaulted(date(), () => new Date()),
  revokedAt: optional(date()),
  ...createUpdateAt,
};

export const reviewAssignment_relations = {
  reviewer: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: false,
    excludes: user_excludes,
    relatedRelations: {
      reviewAssignments: {
        type: "multiple" as RelationDataType,
        limit: 200,
        sort: { field: "createdAt", order: "desc" as RelationSortOrderType },
      },
    },
  },
  assignment: {
    schemaName: "practiceAssignment",
    type: "single" as RelationDataType,
    optional: false,
    relatedRelations: {
      reviewAssignments: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: { field: "createdAt", order: "desc" as RelationSortOrderType },
      },
    },
  },
  assignedBy: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: false,
    excludes: user_excludes,
    relatedRelations: {
      reviewAssignmentsMade: {
        type: "multiple" as RelationDataType,
        limit: 200,
        sort: { field: "createdAt", order: "desc" as RelationSortOrderType },
      },
    },
  },
  revokedBy: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: true,
    excludes: user_excludes,
    relatedRelations: {
      reviewAssignmentsRevoked: {
        type: "multiple" as RelationDataType,
        limit: 200,
        sort: { field: "createdAt", order: "desc" as RelationSortOrderType },
      },
    },
  },
};

export const reviewAssignments = () =>
  coreApp.odm.newModel(
    "reviewAssignment",
    reviewAssignment_pure,
    reviewAssignment_relations,
  );
