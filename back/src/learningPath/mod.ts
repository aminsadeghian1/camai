import { learningPath } from "../../mod.ts";
import { learningPath_pure } from "@model";
import { ALL_ROLES, type CrudConfig, registerCrud } from "@lib";

const staffRoles = ["Manager", "Admin", "ContentEditor"] as const;

export const learningPathSetup = () =>
  registerCrud({
    schema: "learningPath",
    model: learningPath as unknown as CrudConfig["model"],
    pure: learningPath_pure,
    readRoles: ALL_ROLES,
    writeRoles: [...staffRoles],
    removeRoles: ["Manager", "Admin"],
    publishRoles: [...staffRoles],
    publishedOnlyForLearners: true,
    immutableWhenPublished: true,
    publishable: true,
    searchFields: ["key", "title", "description"],
    sortFields: ["_id", "key", "title", "order", "createdAt", "updatedAt"],
    auditWrites: true,
  });
