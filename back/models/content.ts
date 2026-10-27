import { date, defaulted, enums, number, optional } from "lesan";
import { createUpdateAt } from "./utils/createUpdateAt.ts";

export const content_status_array = ["Draft", "Published", "Archived"];

export const content_status_enums = enums(content_status_array);

export const contentCommon = {
  version: defaulted(number(), 1),
  status: defaulted(content_status_enums, "Draft"),
  publishedAt: optional(date()),
  ...createUpdateAt,
};

export type ContentStatus = (typeof content_status_array)[number];

export const isPublished = (doc: { status?: string } | null | undefined) =>
  doc?.status === "Published";
