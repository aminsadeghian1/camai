import { labChallenge } from "../../mod.ts";
import { labChallenge_pure } from "@model";
import { ALL_ROLES, type CrudConfig, registerCrud } from "@lib";

const staffRoles = ["Manager", "Admin", "ContentEditor"] as const;

export const labChallengeSetup = () =>
  registerCrud({
    schema: "labChallenge",
    model: labChallenge as unknown as CrudConfig["model"],
    pure: labChallenge_pure,
    relations: [
      { field: "lab", name: "lab", optional: false },
    ],
    readRoles: ALL_ROLES,
    writeRoles: [...staffRoles],
    removeRoles: ["Manager", "Admin"],
    publishedOnlyForLearners: true,
    immutableWhenPublished: true,
    publishable: true,
    publishRoles: [...staffRoles],
    searchFields: ["title", "description"],
    sortFields: ["_id", "title", "createdAt", "updatedAt"],
    auditWrites: true,
  });
