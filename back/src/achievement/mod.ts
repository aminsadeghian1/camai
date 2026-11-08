import { achievement } from "../../mod.ts";
import { achievement_pure } from "@model";
import { ALL_ROLES, type CrudConfig, registerCrud } from "@lib";

export const achievementSetup = () =>
  registerCrud({
    schema: "achievement",
    model: achievement as unknown as CrudConfig["model"],
    pure: achievement_pure,
    readRoles: ALL_ROLES,
    writeRoles: ["Manager", "Admin"],
    removeRoles: ["Manager", "Admin"],
    searchFields: ["key", "title", "description"],
    sortFields: ["_id", "key", "title", "createdAt", "updatedAt"],
    auditWrites: true,
  });
