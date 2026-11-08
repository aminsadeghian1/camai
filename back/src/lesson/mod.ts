import { lesson } from "../../mod.ts";
import { lesson_pure } from "@model";
import { ALL_ROLES, type CrudConfig, registerCrud } from "@lib";

const staffRoles = ["Manager", "Admin", "ContentEditor"] as const;

export const lessonSetup = () =>
  registerCrud({
    schema: "lesson",
    model: lesson as unknown as CrudConfig["model"],
    pure: lesson_pure,
    relations: [
      { field: "module", name: "module", optional: false },
      {
        field: "prerequisiteSkills",
        name: "prerequisiteSkills",
        optional: true,
        multiple: true,
      },
    ],
    readRoles: ALL_ROLES,
    writeRoles: [...staffRoles],
    removeRoles: ["Manager", "Admin"],
    publishRoles: [...staffRoles],
    publishedOnlyForLearners: true,
    immutableWhenPublished: true,
    publishable: true,
    searchFields: ["key", "title", "objective"],
    sortFields: ["_id", "key", "title", "order", "createdAt", "updatedAt"],
    auditWrites: true,
  });
