import { coreApp } from "../mod.ts";
import { number, object, optional, string } from "lesan";
import { createUpdateAt } from "./utils/createUpdateAt.ts";

export const achievement_pure = {
  key: string(),
  title: string(),
  description: optional(string()),
  definition: object({
    type: string(),
    threshold: number(),
    skillKey: optional(string()),
  }),
  ...createUpdateAt,
};

export const achievement_relations = {};

export const achievements = () =>
  coreApp.odm.newModel("achievement", achievement_pure, achievement_relations);
