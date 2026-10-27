import { coreApp } from "../mod.ts";
import {
  array,
  defaulted,
  enums,
  number,
  object,
  optional,
  type RelationDataType,
  type RelationSortOrderType,
  string,
} from "lesan";
import { contentCommon } from "./content.ts";

export const lesson_block_type_array = [
  "explanation",
  "example",
  "interactiveDemo",
  "photoLab",
  "prediction",
  "challenge",
  "practice",
  "reflection",
];

export const lesson_block_type_enums = enums(lesson_block_type_array);

export const lesson_block = object({
  id: string(),
  type: lesson_block_type_enums,
  title: optional(string()),
  body: optional(string()),
  data: optional(object()),
});

export const lesson_pure = {
  key: string(),
  title: string(),
  objective: optional(string()),
  order: defaulted(number(), 0),
  estimatedMinutes: defaulted(number(), 10),
  blocks: defaulted(array(lesson_block), () => []),
  ...contentCommon,
};

export const lesson_relations = {
  module: {
    schemaName: "module",
    type: "single" as RelationDataType,
    optional: false,
    relatedRelations: {
      lessons: {
        type: "multiple" as RelationDataType,
        limit: 100,
        sort: { field: "order", order: "asc" as RelationSortOrderType },
      },
    },
  },
  prerequisiteSkills: {
    schemaName: "skill",
    type: "multiple" as RelationDataType,
    optional: true,
    relatedRelations: {},
  },
};

export const lessons = () =>
  coreApp.odm.newModel("lesson", lesson_pure, lesson_relations);
