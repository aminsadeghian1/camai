import { coreApp } from "../mod.ts";
import {
  defaulted,
  number,
  optional,
  type RelationDataType,
  type RelationSortOrderType,
  string,
} from "lesan";
import { createUpdateAt } from "./utils/createUpdateAt.ts";

export const module_pure = {
  title: string(),
  description: optional(string()),
  order: defaulted(number(), 0),
  ...createUpdateAt,
};

export const module_relations = {
  course: {
    schemaName: "course",
    type: "single" as RelationDataType,
    optional: false,
    relatedRelations: {
      modules: {
        type: "multiple" as RelationDataType,
        limit: 100,
        sort: { field: "order", order: "asc" as RelationSortOrderType },
      },
    },
  },
};

export const modules = () =>
  coreApp.odm.newModel("module", module_pure, module_relations);
