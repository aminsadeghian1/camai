import { assertEquals } from "@std/assert";
import {
  canAccessAssignmentAsReviewer,
  canManageReviewAssignments,
  isActiveReviewAssignment,
  isAssignedReviewer,
  isReviewerScoped,
  isReviewScopeBypass,
} from "./reviewAccess.ts";

const reviewer = { roleId: "r1", name: "Reviewer" as const };
const learner = { roleId: "l1", name: "Learner" as const };
const admin = { roleId: "a1", name: "Admin" as const };
const manager = { roleId: "m1", name: "Manager" as const };
const user = { _id: "user-1", isGhost: false };

Deno.test("only active review assignments grant access", () => {
  assertEquals(isActiveReviewAssignment({ status: "active" }), true);
  assertEquals(isActiveReviewAssignment({ status: "revoked" }), false);
  assertEquals(isActiveReviewAssignment(null), false);
  assertEquals(isActiveReviewAssignment(undefined), false);
});

Deno.test("manager and admin manage review assignments", () => {
  assertEquals(canManageReviewAssignments(admin), true);
  assertEquals(canManageReviewAssignments(manager), true);
  assertEquals(canManageReviewAssignments(reviewer), false);
  assertEquals(canManageReviewAssignments(learner), false);
});

Deno.test("manager and admin bypass review scope", () => {
  assertEquals(isReviewScopeBypass(admin, user), true);
  assertEquals(isReviewScopeBypass(manager, user), true);
  assertEquals(isReviewScopeBypass(reviewer, user), false);
  assertEquals(isReviewScopeBypass(learner, user), false);
});

Deno.test("ghost without role scope bypasses review scope", () => {
  assertEquals(
    isReviewScopeBypass(reviewer, { _id: "g1", isGhost: true }),
    true,
  );
  assertEquals(
    isReviewScopeBypass(
      { ...reviewer, scopeType: "course", scopeId: "c1" },
      { _id: "g1", isGhost: true },
    ),
    false,
  );
});

Deno.test("only reviewers are reviewer-scoped", () => {
  assertEquals(isReviewerScoped(reviewer, user), true);
  assertEquals(isReviewerScoped(learner, user), false);
  assertEquals(isReviewerScoped(admin, user), false);
  assertEquals(isReviewerScoped(reviewer, { _id: "g1", isGhost: true }), false);
});

Deno.test("reviewer is assigned only to their own reviewer id", () => {
  assertEquals(isAssignedReviewer(reviewer, user, "user-1"), true);
  assertEquals(isAssignedReviewer(reviewer, user, "user-2"), false);
  assertEquals(isAssignedReviewer(learner, user, "user-1"), false);
});

Deno.test("staff can access any assignment as reviewer", () => {
  assertEquals(
    canAccessAssignmentAsReviewer(admin, user, [], "assignment-1"),
    true,
  );
  assertEquals(
    canAccessAssignmentAsReviewer(manager, user, [], "assignment-1"),
    true,
  );
});

Deno.test("reviewer can access only actively assigned assignments", () => {
  assertEquals(
    canAccessAssignmentAsReviewer(
      reviewer,
      user,
      ["assignment-1"],
      "assignment-1",
    ),
    true,
  );
  assertEquals(
    canAccessAssignmentAsReviewer(
      reviewer,
      user,
      ["assignment-1"],
      "assignment-2",
    ),
    false,
  );
});

Deno.test("learner cannot use reviewer access even for assigned ids", () => {
  assertEquals(
    canAccessAssignmentAsReviewer(
      learner,
      user,
      ["assignment-1"],
      "assignment-1",
    ),
    false,
  );
});
