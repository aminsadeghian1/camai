import { coreApp } from "../mod.ts";
import {
  date,
  defaulted,
  type RelationDataType,
  type RelationSortOrderType,
} from "lesan";
import { createUpdateAt } from "./utils/createUpdateAt.ts";

export const userAchievement_pure = {
  awardedAt: defaulted(date(), () => new Date()),
  ...createUpdateAt,
};

export const userAchievement_relations = {
  user: {
    schemaName: "user",
    type: "single" as RelationDataType,
    optional: false,
    relatedRelations: {
      userAchievements: {
        type: "multiple" as RelationDataType,
        limit: 200,
        sort: { field: "awardedAt", order: "desc" as RelationSortOrderType },
      },
    },
  },
  achievement: {
    schemaName: "achievement",
    type: "single" as RelationDataType,
    optional: false,
    relatedRelations: {
      awardedTo: {
        type: "multiple" as RelationDataType,
        limit: 200,
        sort: { field: "awardedAt", order: "desc" as RelationSortOrderType },
      },
    },
  },
};

export const userAchievements = () =>
  coreApp.odm.newModel(
    "userAchievement",
    userAchievement_pure,
    userAchievement_relations,
  );
