# CAMAI Backend - Deno + Lesan

## Overview

This folder is the CAMAI backend: a Deno application built with Lesan (MongoDB ODM and API framework) and TypeScript in strict mode. It serves the Android app and the future web admin portal through Lesan acts over `POST /lesan`.

The product contract is the master specification at the repository root:
`../docs/CAMAI_Complete_Master_Specification_v4_1_Lesan_EN.md`.

## Current Scaffold

Implemented foundation:

- `User`, `Session` and `File` models
- Email/password registration and login
- Short-lived access JWT plus rotating refresh tokens stored hashed in `Session`
- `session.refresh` and `session.logout`
- `user.getMe`
- Shared token, auth, role and context utilities
- Lesan playground and generated type declarations in development

Domain directories for learning, Photo Lab, practice, AI, progress, recommendations, notifications, analytics, audit and sync are placeholders. They are implemented in the next step. Do not implement `web/` or `mobile/` from this backend task.

## Project Structure

```text
back/
├── deno.json
├── mod.ts
├── Dockerfile
├── declarations/           # Generated type declarations
├── models/
│   ├── mod.ts
│   ├── excludes.ts
│   ├── indexes.ts
│   ├── user.ts
│   ├── session.ts
│   ├── file.ts
│   └── utils/createUpdateAt.ts
├── src/
│   ├── mod.ts
│   ├── user/               # register, login, getMe
│   ├── session/            # refresh, logout
│   ├── file/               # media acts (next step)
│   └── ...                 # CAMAI domain folders (placeholders)
├── utils/
│   ├── context.ts
│   ├── setToken.ts
│   ├── setUser.ts
│   ├── grantAccess.ts
│   ├── authzPolicy.ts
│   ├── tokens.ts
│   ├── activeRole.ts
│   ├── pagination.ts
│   ├── throwError.ts
│   └── mod.ts
├── jobs/                   # worker loop, handlers, Deno.cron schedules
├── http/                   # playground e2e collections
├── uploads/                # local development uploads
└── scripts/migrations/
```

Each act lives in its own folder with three files: `mod.ts`, `[action].fn.ts` and `[action].val.ts`.

## Commands

```bash
deno task dev      # watch mode
deno task start    # run once
deno task check    # deno check mod.ts
deno task test     # deno test --allow-all
deno task fmt
deno task lint
```

The API runs on `http://localhost:1405`; the playground is at `/playground` when `ENV=development`.

## Environment

Read from the process environment:

- `MONGO_URI` default `mongodb://127.0.0.1:27017/`
- `MONGO_DB` default `camai`
- `ENV` default `development`
- `APP_PORT` default `1405`
- `TOKEN_KEY`
- `ACCESS_TOKEN_TTL_SECONDS` default `900`
- `REFRESH_TOKEN_TTL_DAYS` default `30`
- `CORS_ORIGINS`
- `STORAGE_DRIVER`, `UPLOAD_DIR`
- `AI_PROVIDER_A_KEY`, `AI_PROVIDER_B_KEY`, `AI_DAILY_QUOTA`

Never commit real secrets. AI keys only exist in backend environment variables.

## Lesan Request Shape

All calls are `POST /lesan`:

```json
{
  "service": "main",
  "model": "user",
  "act": "getMe",
  "details": {
    "set": { "activeRoleId": "<role-uuid>" },
    "get": { "_id": 1, "displayName": 1, "email": 1, "roles": { "roleId": 1, "name": 1 } }
  }
}
```

Authenticated requests send the access token in the request header. The lowercase `token` header is accepted, as is `Authorization: Bearer <token>`. Every authenticated `set` includes `activeRoleId`.

## Model Pattern

Every model exports pure fields, relations and a factory, and spreads `createUpdateAt`:

```ts
export const model_pure = {
  name: string(),
  description: optional(string()),
  ...createUpdateAt,
};

export const model_relations = {
  relationName: {
    schemaName: "targetModel",
    type: "single" as RelationDataType,
    optional: true,
    excludes: target_excludes,
    relatedRelations: {
      reverseRelation: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: { field: "_id", order: "desc" as RelationSortOrderType },
      },
    },
  },
};

export const modelFactory = () =>
  coreApp.odm.newModel("modelName", model_pure, model_relations);
```

## Act Pattern

```ts
// add/mod.ts
export const addSetup = () =>
  coreApp.acts.setAct({
    schema: "note",
    fn: addFn,
    actName: "add",
    preAct: [setTokens, setUser, grantAccess([{ roles: ["Learner"] }])],
    validator: addValidator(),
    validationRunType: "create",
  });

// add/add.val.ts
export const addValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      operationId: string(),
      targetType: enums(["lesson", "lab", "practice", "photo", "general"]),
      targetId: optional(string()),
      body: string(),
      pinned: optional(boolean()),
    }),
    get: selectStruct("note", 1),
  });

// add/add.fn.ts
export const addFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user } = coreApp.contextFns.getContextModel() as MyContext;
  const { activeRoleId, ...rest } = set;
  return await note.insertOne({
    doc: rest,
    projection: get,
    relations: { user: { _ids: [new ObjectId(String(user._id))] } },
  });
};
```

Acts validate and route. Domain logic belongs in `utils/`, not in act files.

## Relation Rules

- Relations are one-directional and never duplicated. The child (the model that belongs to another) defines the relation and uses `relatedRelations`; Lesan creates and maintains the reverse on the parent. Parents never redefine it.
- Single relations are embedded as inline subdocuments (all pure fields plus `_id`). They cost no extra query, and sub-fields such as `lesson.module._id` are indexable like top-level fields.
- Use relations instead of `fooId` plus `fooName` pure fields. Use pure-field snapshots only for immutable audit data or when the reference must survive deletion of the source.
- Limit reverse arrays with `limit` and `sort`. Never put unbounded collections (lab events, evidence history, analytics) in `relatedRelations`; query them by `attempt._id` or `user._id` instead. Respect the MongoDB 16 MB document limit.
- Use `excludes` so passwords, refresh token hashes and storage keys never appear in embedded copies.
- Separate pure field updates (`update`) from relation updates (`updateRelations`).

Parent-child example:

```ts
export const lesson_relations = {
  module: {
    schemaName: "module",
    type: "single" as RelationDataType,
    optional: false,
    relatedRelations: {
      lessons: {
        type: "multiple" as RelationDataType,
        limit: 100,
        sort: { field: "order", order: "asc" as RelationSortOrderType },
      },
    },
  },
};
```

## Deletion

`deleteOne` accepts `hardCascade` (default `false`). Without it, deleting a child removes it from the parent automatically, and deleting a parent that still has children is blocked. With `hardCascade: true` the parent and all children are deleted.

- Delete children first.
- Never use `hardCascade` for routine cleanup.
- Only the audited account-deletion job may use it.
- Remove acts always pass `hardCascade: hardCascade || false`.

```ts
return await modelName.deleteOne({
  filter: { _id: new ObjectId(_id as string) },
  hardCascade: hardCascade || false,
});
```

## Authentication and Authorization

Authentication uses a short-lived access JWT and a rotating refresh token stored hashed in `Session`.

- `user.register` is public and creates a `Learner`.
- `user.login` verifies the password, creates a `Session` and returns an access token plus `refreshToken` in the form `<sessionId>.<secret>`.
- `session.refresh` verifies and revokes the old session, then issues a new session.
- `session.logout` revokes the current refresh session after verifying ownership.
- `user.getMe` requires a valid access token and `activeRoleId`.

Authorization layers:

1. **Role gate:** `grantAccess(checks)` declares which roles may call an act. It reads `activeRoleId` and never trusts client-supplied scope IDs.
2. **DB-derived ownership and scope:** every user-scoped read or write loads the target and checks ownership or scope before mutating. A role gate alone is insufficient.
3. **Object rules:** shared helpers in `utils/` enforce attempt, submission, note, file and content rules.

Roles: `Manager`, `Admin`, `ContentEditor`, `Reviewer`, `Learner`.

`Manager` and `Admin` bypass scope checks but must still be listed in `grantAccess`. `isGhost` bypasses checks only when the active role has no scope. Use the shared helpers in `utils/authzPolicy.ts` instead of inspecting `isGhost` directly.

## Idempotency

Every mutation that can be retried carries a client-generated `operationId`. Add unique indexes for `operationId` on retryable models such as `LabAttempt`, `LabEvent`, `PracticeSubmission` and `Note`. On a duplicate, return the original result instead of creating a second record.

## Content Versioning

Published learning content is immutable. A `LabAttempt` stores the exact content version it used. Editing a lesson, Lab or challenge creates a new version instead of changing the historical meaning of old attempts.

## Jobs

The `Job` collection holds queue, payload, status (`queued`, `running`, `done`, `failed`, `dead`), attempts, maxAttempts, runAt, lockedUntil, lastError and a unique idempotencyKey.

- `jobs/` starts with a placeholder worker. The real worker loop uses atomic `findOneAndUpdate` locking.
- Retries use exponential backoff up to `maxAttempts`, then the job becomes dead and visible in the admin portal.
- `Deno.cron` schedules notification dispatch, analytics rollup, expired session and file cleanup, and account-deletion execution.
- The queue is accessed through `enqueue()` / `process()` so it can move to Redis later without changing callers.

## Media

- `file.requestUpload` creates a `File` with status `pending` and returns a short-lived signed upload URL or local one-time upload token.
- The client uploads the binary.
- `file.completeUpload` verifies size, MIME type and magic bytes, extracts safe metadata and sets status `uploaded`.
- Reads go through `file.getSignedUrl`; private user photos are never served from a public static path.
- Never expose `storageKey` through relations or responses.

## Pure Domain Logic

Calculations live in `utils/`, never in act files, so they are unit-testable and shared:

- `labScoring.ts` - deterministic exposure, depth-of-field and field-of-view formulas. The server implementation must match the Android engine test vectors. AI never decides numeric correctness.
- `skillEngine.ts` - evidence-based mastery state calculation.
- `recommendationEngine.ts` - next-activity selection with `reasonCode` explainability.
- `resumeResolver.ts` - learning resume algorithm.

## Planned Models

Identity and account:

- `User`: displayName, email, mobile?, password hash, is_verified, isGhost, status, settings, roles; avatar relation.
- `Session`: refreshTokenHash, device, expiresAt, revokedAt; user relation.
- `File`: name, mimeType, size, type, storageKey, metadata, status; owner relation.

Learning content:

- `LearningPath`, `Course`, `Module`, `Lesson`, `Lab`, `LabScene`, `LabChallenge`

Learner activity:

- `LessonProgress`, `LabAttempt`, `LabEvent`, `LabResult`, `PracticeAssignment`, `PracticeSubmission`, `Note`

AI and jobs:

- `AiReview`, `Job`

Progress and engagement:

- `Skill`, `SkillProgress`, `Recommendation`, `Achievement`, `UserAchievement`

Operations:

- `AnalyticsEvent`, `AuditLog`, `Notification`

## Testing

- Unit-test deterministic logic in `utils/`.
- Use the Lesan playground and `http/e2e.json` for manual API flows.
- Keep tests independent from production secrets and real AI providers.

## Scripting

Ad-hoc scripts belong in the repository-root `ignore-scripts/` folder. Do not commit them.

## Git

Follow the root `AGENTS.md` Git commit instructions. Never use `git reset`.
