import { module } from "../../mod.ts";
import { module_pure } from "@model";
import { ALL_ROLES, type CrudConfig, registerCrud } from "@lib";

const staffRoles = ["Manager", "Admin", "ContentEditor"] as const;

export const moduleSetup = () =>
  registerCrud({
    schema: "module",
    model: module as unknown as CrudConfig["model"],
    pure: module_pure,
    relations: [
      { field: "course", name: "course", optional: false },
    ],
    readRoles: ALL_ROLES,
    writeRoles: [...staffRoles],
    removeRoles: ["Manager", "Admin"],
    searchFields: ["title", "description"],
    sortFields: ["_id", "title", "order", "createdAt", "updatedAt"],
    auditWrites: true,
  });
