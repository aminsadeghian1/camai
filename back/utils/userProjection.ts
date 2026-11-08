export const SENSITIVE_USER_FIELDS = [
  "password",
  "passwordResetTokenHash",
  "passwordResetExpiresAt",
] as const;

export const SENSITIVE_NESTED_FIELDS = [
  "refreshTokenHash",
  "storageKey",
] as const;

export const SENSITIVE_RESPONSE_FIELDS = [
  ...SENSITIVE_USER_FIELDS,
  ...SENSITIVE_NESTED_FIELDS,
] as const;

export const USER_PUBLIC_FIELDS = [
  "_id",
  "displayName",
  "email",
  "mobile",
  "is_verified",
  "isGhost",
  "status",
  "settings",
  "roles",
  "deletionRequestedAt",
  "lastLoginAt",
  "createdAt",
  "updatedAt",
  "avatar",
  "files",
  "sessions",
  "lessonProgresses",
  "labAttempts",
  "practiceAssignments",
  "notes",
  "aiReviews",
  "skillProgresses",
  "recommendations",
  "userAchievements",
  "notifications",
  "reviewAssignments",
  "reviewAssignmentsMade",
  "reviewAssignmentsRevoked",
] as const;

export type UserProjection = { [key: string]: number | UserProjection };

const sensitiveResponseFields = new Set<string>(SENSITIVE_RESPONSE_FIELDS);
const publicFields = new Set<string>(USER_PUBLIC_FIELDS);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (!isRecord(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const defaultProjection = (): UserProjection =>
  Object.fromEntries(USER_PUBLIC_FIELDS.map((field) => [field, 1]));

const sanitizeNestedProjection = (
  projection: Record<string, unknown>,
): UserProjection | 1 | null => {
  const sanitized: UserProjection = {};
  let requestedFields = 0;
  let requestedInclusion = false;

  for (const [field, value] of Object.entries(projection)) {
    requestedFields++;
    if (value === 1 || isRecord(value)) requestedInclusion = true;
    if (sensitiveResponseFields.has(field)) continue;

    if (value === 1 || value === 0) {
      sanitized[field] = value;
      continue;
    }

    if (isRecord(value)) {
      const nested = sanitizeNestedProjection(value);
      if (nested === 1) sanitized[field] = 1;
      else if (nested) sanitized[field] = nested;
    }
  }

  if (requestedFields === 0) return 1;
  if (Object.keys(sanitized).length) return sanitized;
  return requestedInclusion ? null : 1;
};

export const sanitizeUserProjection = (
  projection: unknown,
): UserProjection => {
  if (!isRecord(projection)) return defaultProjection();

  const inclusions: Array<[string, unknown]> = [];
  const exclusions = new Set<string>();

  for (const [field, value] of Object.entries(projection)) {
    if (!publicFields.has(field) || sensitiveResponseFields.has(field)) {
      continue;
    }

    if (value === 1 || isRecord(value)) {
      inclusions.push([field, value]);
    } else if (value === 0) {
      exclusions.add(field);
    }
  }

  if (exclusions.size) {
    const safe = defaultProjection();

    for (const field of exclusions) {
      if (field === "_id") safe._id = 0;
      else delete safe[field];
    }

    for (const [field, value] of inclusions) {
      if (isRecord(value)) {
        const nested = sanitizeNestedProjection(value);
        if (nested) safe[field] = nested;
      } else {
        safe[field] = value as number;
      }
    }

    return safe;
  }

  const safe: UserProjection = {};

  for (const [field, value] of inclusions) {
    if (isRecord(value)) {
      const nested = sanitizeNestedProjection(value);
      if (nested) safe[field] = nested;
    } else {
      safe[field] = value as number;
    }
  }

  return Object.keys(safe).length ? safe : defaultProjection();
};

export const sanitizeUserResponse = <T>(value: T): T => {
  if (Array.isArray(value)) {
    for (const item of value) sanitizeUserResponse(item);
    return value;
  }

  if (!isPlainObject(value)) return value;

  for (const field of SENSITIVE_RESPONSE_FIELDS) {
    delete value[field];
  }

  for (const child of Object.values(value)) {
    sanitizeUserResponse(child);
  }

  return value;
};
