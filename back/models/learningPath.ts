import { coreApp } from "../mod.ts";
import { optional, string } from "lesan";
import { contentCommon } from "./content.ts";

export const learningPath_pure = {
  key: string(),
  title: string(),
  description: optional(string()),
  ...contentCommon,
};

export const learningPath_relations = {};

export const learningPaths = () =>
  coreApp.odm.newModel(
    "learningPath",
    learningPath_pure,
    learningPath_relations,
  );
