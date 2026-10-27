import type { Document } from "lesan";
import { coreApp } from "../mod.ts";
import type { MyContext } from "./context.ts";
import { throwError } from "./throwError.ts";

export const currentUser = (): MyContext["user"] => {
  const context = coreApp.contextFns.getContextModel() as MyContext;
  return context.user;
};

export const currentUserId = (): string =>
  String(currentUser()?._id ?? "");

export const embeddedUserId = (doc: Document | null | undefined): string => {
  const relationUser = doc?.user as { _id?: unknown } | undefined;
  return String(relationUser?._id ?? "");
};

export const assertOwner = (
  doc: Document | null | undefined,
  userId = currentUserId(),
  relationName = "user",
): void => {
  if (!doc) throwError("NOT_FOUND: Record not found");

  const owner = doc[relationName] as { _id?: unknown } | undefined;

  if (!owner?._id || String(owner._id) !== String(userId)) {
    throwError("FORBIDDEN: You do not own this record");
  }
};
