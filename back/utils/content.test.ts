import { assertEquals, assertThrows } from "@std/assert";
import { AppError, isAppError } from "./throwError.ts";
import {
  assertContentEditable,
  assertContentRemovable,
  assertPublished,
  isContentStaff,
} from "./content.ts";

const captured = (fn: () => unknown): AppError => {
  try {
    fn();
  } catch (error) {
    if (isAppError(error)) return error;
    throw error;
  }
  throw new Error("Expected function to throw");
};

Deno.test("staff roles are recognized", () => {
  assertEquals(
    isContentStaff({ roleId: "1", name: "ContentEditor" }),
    true,
  );
  assertEquals(isContentStaff({ roleId: "1", name: "Learner" }), false);
});

Deno.test("assertPublished rejects missing and draft content", () => {
  assertEquals(captured(() => assertPublished(null)).code, "NOT_FOUND");
  assertEquals(
    captured(() => assertPublished({ _id: "1", status: "Draft" })).code,
    "NOT_FOUND",
  );
  assertEquals(
    assertPublished({ _id: "1", status: "Published" })._id,
    "1",
  );
});

Deno.test("published content cannot be edited or removed", () => {
  const doc = { _id: "1", status: "Published" };
  assertEquals(
    captured(() => assertContentEditable(doc)).code,
    "PUBLISHED_IMMUTABLE",
  );
  assertEquals(
    captured(() => assertContentRemovable(doc)).code,
    "PUBLISHED_IMMUTABLE",
  );
});

Deno.test("draft content is editable and removable", () => {
  const draft = { _id: "1", status: "Draft" };
  assertEquals(assertContentEditable(draft), draft);
  assertEquals(assertContentRemovable(draft), draft);
  assertThrows(() => assertContentEditable(null));
});
