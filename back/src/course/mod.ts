import { course } from "../../mod.ts";
import { course_pure } from "@model";
import { ALL_ROLES, type CrudConfig, registerCrud } from "@lib";

const staffRoles = ["Manager", "Admin", "ContentEditor"] as const;

export const courseSetup = () =>
  registerCrud({
    schema: "course",
    model: course as unknown as CrudConfig["model"],
    pure: course_pure,
    relations: [
      { field: "path", name: "path", optional: false },
    ],
    readRoles: ALL_ROLES,
    writeRoles: [...staffRoles],
    removeRoles: ["Manager", "Admin"],
    publishRoles: [...staffRoles],
    publishedOnlyForLearners: true,
    immutableWhenPublished: true,
    publishable: true,
    searchFields: ["title", "description"],
    sortFields: ["_id", "title", "order", "createdAt", "updatedAt"],
    auditWrites: true,
  });
