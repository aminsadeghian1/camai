import { coreApp } from "../mod.ts";
import {
  defaulted,
  number,
  optional,
  type RelationDataType,
  type RelationSortOrderType,
  string,
} from "lesan";
import { contentCommon } from "./content.ts";
import { createUpdateAt } from "./utils/createUpdateAt.ts";

export const course_pure = {
  title: string(),
  description: optional(string()),
  order: defaulted(number(), 0),
  ...contentCommon,
};

export const course_relations = {
  path: {
    schemaName: "learningPath",
    type: "single" as RelationDataType,
    optional: false,
    relatedRelations: {
      courses: {
        type: "multiple" as RelationDataType,
        limit: 100,
        sort: { field: "order", order: "asc" as RelationSortOrderType },
      },
    },
  },
};

export const courseMeta = { ...createUpdateAt };

export const courses = () =>
  coreApp.odm.newModel("course", course_pure, course_relations);
