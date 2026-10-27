import { coreApp } from "../mod.ts";
import {
  enums,
  object,
  optional,
  type RelationDataType,
  type RelationSortOrderType,
  string,
} from "lesan";
import { contentCommon } from "./content.ts";

export const lab_type_array = [
  "shutter",
  "aperture",
  "iso",
  "depthOfField",
  "focalLength",
  "cameraDistance",
  "exposureTriangle",
  "freeExperiment",
];

export const lab_type_enums = enums(lab_type_array);

export const lab_pure = {
  labType: lab_type_enums,
  title: optional(string()),
  instructions: optional(string()),
  configuration: object({
    canonicalControls: optional(object()),
    ranges: optional(object()),
    target: optional(object()),
  }),
  ...contentCommon,
};

export const lab_relations = {
  lesson: {
    schemaName: "lesson",
    type: "single" as RelationDataType,
    optional: false,
    relatedRelations: {
      labs: {
        type: "multiple" as RelationDataType,
        limit: 20,
        sort: { field: "_id", order: "desc" as RelationSortOrderType },
      },
    },
  },
  scene: {
    schemaName: "labScene",
    type: "single" as RelationDataType,
    optional: true,
    relatedRelations: {},
  },
};

export const labs = () => coreApp.odm.newModel("lab", lab_pure, lab_relations);
