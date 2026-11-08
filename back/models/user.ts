import { coreApp } from "../mod.ts";
import {
  array,
  boolean,
  date,
  defaulted,
  enums,
  object,
  optional,
  pattern,
  type RelationDataType,
  string,
} from "lesan";
import { createUpdateAt } from "./utils/createUpdateAt.ts";
import { file_excludes } from "./excludes.ts";

export const role_array = [
  "Manager",
  "Admin",
  "ContentEditor",
  "Reviewer",
  "Learner",
];

export const role_enums = enums(role_array);

export const status_array = ["active", "suspended", "deleted"];

export const status_enums = enums(status_array);

export const emailPattern = pattern(
  string(),
  /^[\w.+-]+@([\w-]+\.)+[\w-]{2,}$/,
);

export const user_pure = {
  displayName: string(),
  email: emailPattern,
  mobile: optional(string()),
  password: string(),
  is_verified: defaulted(boolean(), false),
  isGhost: defaulted(boolean(), false),
  status: defaulted(status_enums, "active"),
  settings: defaulted(
    object({
      language: defaulted(string(), "en"),
      notifications: defaulted(
        object({
          push: defaulted(boolean(), true),
          email: defaulted(boolean(), true),
        }),
        () => ({ push: true, email: true }),
      ),
      privacy: defaulted(
        object({
          aiProcessingConsent: defaulted(boolean(), false),
          analyticsConsent: defaulted(boolean(), true),
        }),
        () => ({ aiProcessingConsent: false, analyticsConsent: true }),
      ),
    }),
    () => ({
      language: "en",
      notifications: { push: true, email: true },
      privacy: { aiProcessingConsent: false, analyticsConsent: true },
    }),
  ),
  roles: defaulted(
    array(object({
      roleId: string(),
      name: role_enums,
      scopeType: optional(string()),
      scopeId: optional(string()),
    })),
    () => [{ roleId: crypto.randomUUID(), name: "Learner" }],
  ),
  passwordResetTokenHash: optional(string()),
  passwordResetExpiresAt: optional(date()),
  deletionRequestedAt: optional(date()),
  lastLoginAt: optional(date()),
  ...createUpdateAt,
};

export const user_relations = {
  avatar: {
    schemaName: "file",
    type: "single" as RelationDataType,
    optional: true,
    excludes: file_excludes,
    relatedRelations: {},
  },
};

export const users = () =>
  coreApp.odm.newModel("user", user_pure, user_relations, {
    createIndex: {
      indexSpec: {
        email: 1,
      },
      options: { unique: true },
    },
    excludes: ["password"],
  });
