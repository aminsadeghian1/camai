import {
  type ActiveRole,
  isManagerLike,
  isScopeBypass,
} from "./authzPolicy.ts";

export type ReviewAccessUser = {
  _id?: unknown;
  isGhost?: boolean;
};

export const isActiveReviewAssignment = (
  doc: { status?: unknown } | null | undefined,
): boolean => doc?.status === "active";

export const canManageReviewAssignments = (
  activeRole: ActiveRole,
): boolean => isManagerLike(activeRole);

export const isReviewScopeBypass = (
  activeRole: ActiveRole,
  user: ReviewAccessUser | undefined,
): boolean => isScopeBypass(activeRole, user);

export const isReviewerScoped = (
  activeRole: ActiveRole,
  user: ReviewAccessUser | undefined,
): boolean =>
  !isReviewScopeBypass(activeRole, user) && activeRole.name === "Reviewer";

export const isAssignedReviewer = (
  activeRole: ActiveRole,
  user: ReviewAccessUser | undefined,
  reviewerId: unknown,
): boolean => {
  if (isReviewScopeBypass(activeRole, user)) return true;
  if (activeRole.name !== "Reviewer") return false;

  const userId = String(user?._id ?? "");
  return userId.length > 0 && userId === String(reviewerId ?? "");
};

export const canAccessAssignmentAsReviewer = (
  activeRole: ActiveRole,
  user: ReviewAccessUser | undefined,
  allowedAssignmentIds: Iterable<unknown>,
  assignmentId: unknown,
): boolean => {
  if (isReviewScopeBypass(activeRole, user)) return true;
  if (activeRole.name !== "Reviewer") return false;

  const target = String(assignmentId ?? "");
  if (!target) return false;

  for (const allowedId of allowedAssignmentIds) {
    if (String(allowedId) === target) return true;
  }

  return false;
};
