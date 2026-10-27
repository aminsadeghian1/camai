import { coreApp } from "../mod.ts";
import {
  number,
  object,
  optional,
  type RelationDataType,
  string,
} from "lesan";
import { createUpdateAt } from "./utils/createUpdateAt.ts";

export const labScene_pure = {
  title: string(),
  description: optional(string()),
  cameraModel: object({
    sensorWidth: number(),
    sensorHeight: number(),
    cropFactor: number(),
    focalLengthMin: number(),
    focalLengthMax: number(),
    apertureMin: number(),
    apertureMax: number(),
    isoMin: number(),
    isoMax: number(),
    shutterMin: number(),
    shutterMax: number(),
  }),
  ...createUpdateAt,
};

export const labScene_relations = {
  assets: {
    schemaName: "file",
    type: "multiple" as RelationDataType,
    optional: true,
    relatedRelations: {},
  },
};

export const labScenes = () =>
  coreApp.odm.newModel("labScene", labScene_pure, labScene_relations);
