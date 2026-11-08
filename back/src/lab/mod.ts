import { lab } from "../../mod.ts";
import { lab_pure } from "@model";
import { ALL_ROLES, type CrudConfig, registerCrud } from "@lib";

const staffRoles = ["Manager", "Admin", "ContentEditor"] as const;

export const labSetup = () =>
  registerCrud({
    schema: "lab",
    model: lab as unknown as CrudConfig["model"],
    pure: lab_pure,
    relations: [
      { field: "lesson", name: "lesson", optional: false },
      { field: "scene", name: "scene", optional: true },
    ],
    readRoles: ALL_ROLES,
    writeRoles: [...staffRoles],
    removeRoles: ["Manager", "Admin"],
    publishRoles: [...staffRoles],
    publishedOnlyForLearners: true,
    immutableWhenPublished: true,
    publishable: true,
    searchFields: ["title", "instructions"],
    sortFields: ["_id", "title", "labType", "createdAt", "updatedAt"],
    auditWrites: true,
  });
