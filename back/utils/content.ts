import type { Document } from "lesan";
import type { ActiveRole } from "./authzPolicy.ts";
import { getAuth } from "./grantAccess.ts";
import { throwError } from "./throwError.ts";

const contentStaff = new Set(["Manager", "Admin", "ContentEditor"]);

export const isContentStaff = (role: ActiveRole): boolean =>
  contentStaff.has(role.name);

export const currentContentAccess = async () => {
  const { activeRole, user } = await getAuth();
  return { activeRole, user, staff: isContentStaff(activeRole) };
};

export const assertPublished = (doc: Document | null | undefined): Document => {
  if (!doc || doc.status !== "Published") {
    return throwError("NOT_FOUND: Published content not found");
  }
  return doc;
};

export const assertContentEditable = (
  doc: Document | null | undefined,
): Document => {
  if (!doc) throwError("NOT_FOUND: Content not found");
  if (doc.status === "Published") {
    throwError("PUBLISHED_IMMUTABLE: Published content cannot be edited");
  }
  return doc;
};

export const assertContentRemovable = (
  doc: Document | null | undefined,
): Document => {
  if (!doc) throwError("NOT_FOUND: Content not found");
  if (doc.status === "Published") {
    throwError(
      "PUBLISHED_IMMUTABLE: Published content cannot be removed; archive it instead",
    );
  }
  return doc;
};
