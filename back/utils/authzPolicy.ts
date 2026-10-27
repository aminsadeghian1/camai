export type RoleName =
  | "Manager"
  | "Admin"
  | "ContentEditor"
  | "Reviewer"
  | "Learner";

export type ActiveRole = {
  roleId: string;
  name: RoleName;
  scopeType?: string;
  scopeId?: string;
};

export const ALL_ROLES: RoleName[] = [
  "Manager",
  "Admin",
  "ContentEditor",
  "Reviewer",
  "Learner",
];

export const isManagerLike = (role: ActiveRole): boolean =>
  role.name === "Manager" || role.name === "Admin";

export const hasRoleScope = (role: ActiveRole): boolean =>
  Boolean(role.scopeType || role.scopeId);

export const isGhostScopeBypass = (
  activeRole: ActiveRole,
  user: { isGhost?: boolean } | undefined,
): boolean => Boolean(user?.isGhost) && !hasRoleScope(activeRole);

export const isScopeBypass = (
  activeRole: ActiveRole,
  user: { isGhost?: boolean } | undefined,
): boolean => isManagerLike(activeRole) || isGhostScopeBypass(activeRole, user);

export const scopeMatches = (
  role: ActiveRole,
  scope: { scopeType: string; scopeId: string } | null,
): boolean => {
  if (!scope || !role.scopeType || !role.scopeId) return false;
  return role.scopeType === scope.scopeType &&
    String(role.scopeId) === String(scope.scopeId);
};

export const isRoleAllowed = (
  role: ActiveRole,
  allowed: RoleName[],
): boolean => allowed.includes(role.name);
