import { coreApp } from "../mod.ts";
import { defaulted, number, string } from "lesan";
import { createUpdateAt } from "./utils/createUpdateAt.ts";

export const skill_pure = {
  key: string(),
  title: string(),
  version: defaulted(number(), 1),
  ...createUpdateAt,
};

export const skill_relations = {};

export const skills = () =>
  coreApp.odm.newModel("skill", skill_pure, skill_relations, {
    createIndex: {
      indexSpec: { key: 1 },
      options: { unique: true },
    },
  });
