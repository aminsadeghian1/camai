import {
  type ActiveRole,
  isGhostScopeBypass,
  isRoleAllowed,
  type RoleName,
} from "./authzPolicy.ts";
import { throwError } from "./throwError.ts";

export type GrantBody = {
  details: { set: Record<string, unknown> };
};

export type RoleCheck = {
  roles: RoleName[];
};

type AuthUser = {
  isGhost?: boolean;
  roles?: ActiveRole[];
};

type AuthContext = {
  user?: AuthUser;
  body?: GrantBody;
};

type ContextGetter = () => AuthContext | Promise<AuthContext>;

const CORE_APP_MODULE = "../mod.ts";

type CoreApp = {
  contextFns: { getContextModel: () => unknown };
};

const loadCoreApp = async (): Promise<CoreApp> => {
  const mod = await import(CORE_APP_MODULE) as { coreApp: CoreApp };
  return mod.coreApp;
};

const defaultGetContext: ContextGetter = async () => {
  const coreApp = await loadCoreApp();
  return coreApp.contextFns.getContextModel() as AuthContext;
};

const readAuth = (user: AuthUser | undefined, body: GrantBody | undefined) => {
  if (!user) return throwError("UNAUTHORIZED: Active role not found");

  const activeRoleId = body?.details?.set?.activeRoleId;

  if (!activeRoleId) {
    return throwError("UNAUTHORIZED: activeRoleId is required");
  }

  const activeRole = (user.roles ?? []).find((role) =>
    role.roleId === activeRoleId
  );

  if (!activeRole) {
    return throwError("FORBIDDEN: Active role not found");
  }

  return { user, activeRole, body };
};

export const getAuth = async (
  getContext: ContextGetter = defaultGetContext,
) => {
  const context = await getContext();
  return readAuth(context?.user, context?.body);
};

export const grantAccess = (
  checks: RoleCheck[],
  getContext: ContextGetter = defaultGetContext,
) => {
  const checkAccess = async () => {
    const context = await getContext();
    const { user, activeRole } = readAuth(context?.user, context?.body);

    if (isGhostScopeBypass(activeRole, user)) return;

    if (!checks.some((check) => isRoleAllowed(activeRole, check.roles))) {
      throwError("FORBIDDEN: You cant do this");
    }
  };

  return checkAccess;
};
