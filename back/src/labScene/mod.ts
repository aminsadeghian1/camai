import { labScene } from "../../mod.ts";
import { labScene_pure } from "@model";
import { ALL_ROLES, type CrudConfig, registerCrud } from "@lib";

const staffRoles = ["Manager", "Admin", "ContentEditor"] as const;

export const labSceneSetup = () =>
  registerCrud({
    schema: "labScene",
    model: labScene as unknown as CrudConfig["model"],
    pure: labScene_pure,
    relations: [
      {
        field: "assets",
        name: "assets",
        optional: true,
        multiple: true,
      },
    ],
    readRoles: ALL_ROLES,
    writeRoles: [...staffRoles],
    removeRoles: ["Manager", "Admin"],
    searchFields: ["title", "description"],
    sortFields: ["_id", "title", "createdAt", "updatedAt"],
    auditWrites: true,
  });
