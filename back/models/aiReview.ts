import { coreApp } from "../mod.ts";
import {
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

export const ai_review_status_array = ["queued", "running", "valid", "failed"];

export const ai_review_status_enums = enums(ai_review_status_array);

export const aiReview_pure = {
  provider: string(),
  model: string(),
  promptVersion: string(),
  reviewVersion: defaulted(string(), "1.0"),
  status: defaulted(ai_review_status_enums, "queued"),
  result: optional(object()),
  errorDiagnostics: optional(string()),
  attempts: defaulted(number(), 0),
  ...createUpdateAt,
};

export const aiReview_relations = {
  submission: {
    schemaName: "practiceSubmission",
    type: "single" as RelationDataType,
    optional: false,
    relatedRelations: {
      reviews: {
        type: "multiple" as RelationDataType,
        limit: 20,
        sort: { field: "createdAt", order: "desc" as RelationSortOrderType },
      },
    },
  },
  user: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: false,
    relatedRelations: {
      aiReviews: {
        type: "multiple" as RelationDataType,
        limit: 200,
        sort: { field: "createdAt", order: "desc" as RelationSortOrderType },
      },
    },
  },
};

export const aiReviews = () =>
  coreApp.odm.newModel("aiReview", aiReview_pure, aiReview_relations);
