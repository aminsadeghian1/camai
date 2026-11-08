# CAMAI Development Roadmap

> Living document for resuming work across sessions. Last repository inspection: **2026-10-27**.
>
> Product contract: [`docs/CAMAI_Complete_Master_Specification_v4_1_Lesan_EN.md`](docs/CAMAI_Complete_Master_Specification_v4_1_Lesan_EN.md) (spec v4.1).
> Backend rules: [`back/AGENTS.md`](back/AGENTS.md).
> Existing completion plan: [`docs/superpowers/plans/2026-10-27-camai-backend-completion.md`](docs/superpowers/plans/2026-10-27-camai-backend-completion.md).
>
> This file records repository state and priorities. It does not replace the specification or `AGENTS.md`. Update it when the code changes.

## A. Project Overview

**Purpose:** CAMAI is a photography learning and intelligent shooting platform: structured lessons, interactive Photo Labs, real-world practice, AI critique, personal notes, progress tracking, synchronization and a future admin portal.

**Current development stage:** Backend foundation / pre-alpha. The data model and many domain utilities are implemented, but most Lesan acts, media routes, admin APIs and sync are missing. Static checks currently fail, so the backend is **not yet verified as runnable or end-to-end functional**.

**Main technologies:**

- Runtime: Deno 2 (observed locally: `deno 2.9.8`).
- Framework/ODM: Lesan `^0.2.3` (`back/deno.json`), MongoDB, TypeScript in strict mode.
- Auth: `djwt` access tokens + rotating refresh tokens hashed in `Session`.
- Storage: local filesystem or S3-compatible adapter behind `StorageAdapter`.
- Jobs: MongoDB-backed `Job` collection with an in-process worker loop.
- API shape: one `POST /lesan` endpoint with service/model/act/details, plus `/playground` in development.
- Frontends: `web/` (Next.js) and `mobile/` (Kotlin/Compose) are **not present and out of scope** until explicitly requested.

**Architecture rules already adopted:**

- Models own persistence and relations; acts validate and route.
- Relations are one-directional; the child defines the relation and `relatedRelations`.
- Domain calculations live in `utils/`, not acts.
- Every authenticated request carries `activeRoleId`; authorization combines role gates with DB-derived ownership.
- Retryable writes use `operationId`; published content is immutable.
- Sensitive fields are excluded from relations (`password`, refresh hashes, `storageKey`).

**Important directories:**

| Path | Responsibility |
|---|---|
| `docs/` | Master specification and implementation plan. |
| `back/mod.ts` | Entry point: Mongo connection, model instances, act setup, indexes, worker, HTTP server. |
| `back/models/` | 27 Lesan model definitions, excludes, index bootstrap, shared content fields. |
| `back/src/` | Lesan acts. Only `user/` and `session/` currently contain implementations; 25 domain folders are placeholders. |
| `back/utils/` | Auth, authorization, CRUD factory, content rules, media, signed URLs, storage, AI, jobs, lab scoring, skill/recommendation/resume engines. |
| `back/jobs/` | Job worker and queue handlers. |
| `back/http/` | Playground e2e collections. Both files are currently empty arrays. |
| `back/declarations/` | Generated Lesan type declarations (only `selectInp.ts` is present). |
| `back/scripts/migrations/` | Placeholder; no migrations yet. |
| `back/uploads/` | Local development upload directory (`.gitkeep` only). |
| `web/`, `mobile/` | Not started; do not build until the backend is functional and the human partner asks. |

## B. Current Implementation Status

Legend:

- `[x]` Completed and verified.
- `[~]` Partially implemented or implemented but not verified.
- `[ ]` Not implemented.
- `[?]` Unknown / not yet verified.
- `[!]` Blocked by a concrete issue.

| Area | Status | Evidence / notes |
|---|---|---|
| Spec and completion plan present | `[x]` | `docs/CAMAI_Complete_Master_Specification_v4_1_Lesan_EN.md`, `docs/superpowers/plans/2026-10-27-camai-backend-completion.md`. |
| Deno + Lesan + Mongo bootstrap | `[~]` | `back/mod.ts` wires models, acts, indexes, worker and server; `deno check` currently fails. |
| All 27 core models defined | `[~]` | `back/models/*.ts`, exported from `back/models/mod.ts`; no runtime/schema verification yet. |
| Index bootstrap | `[~]` | `back/models/indexes.ts` defines unique/TTL/history/queue indexes; not executed in this review. |
| Registration, login, `getMe` | `[~]` | `back/src/user/register`, `login`, `getMe`; no integration tests. |
| Refresh rotation and logout | `[~]` | `back/src/session/refresh`, `logout`; revoked-token-chain behavior is missing. |
| Forgot/reset password | `[ ]` | No acts; user model already has reset fields. |
| `updateMe`, `updateSettings`, `deleteMe` | `[ ]` | No acts; account-deletion job handler exists but is not exposed. |
| Role/authz pure helpers | `[x]` | `back/utils/authzPolicy.ts`; 4 unit tests pass in `back/utils/authzPolicy.test.ts`. |
| Ownership/scope helpers for attempts/submissions | `[ ]` | `utils/scope.ts` only has generic `assertOwner`; spec names `ownerScope`, `readScope`, `checkAttemptOwner`, `checkSubmissionOwner`. |
| Request IDs and HTTP error mapping | `[~]` | `utils/throwError.ts` defines `AppError`; no request-ID pre-act and no verified Lesan status mapping. |
| Generic CRUD act factory | `[~]` | `back/utils/crud.ts:578` (`registerCrud`) exists but is not called anywhere and has type errors. |
| Content models | `[~]` | LearningPath, Course, Module, Lesson, Lab, LabScene, LabChallenge defined. |
| Content/admin CRUD and publish acts | `[ ]` | All content folders contain only `.gitkeep`. |
| Lesson progress acts | `[ ]` | `back/src/lessonProgress/.gitkeep`; `utils/resumeResolver.ts` exists but unused. |
| Lab scoring utility | `[~]` | `back/utils/labScoring.ts`; no tests and no acts use it. |
| Lab attempts/events/results acts | `[ ]` | Placeholder folders only. |
| Practice acts | `[ ]` | Placeholder folders only. |
| Notes acts | `[ ]` | Placeholder folder only; model and idempotency index exist. |
| Media utilities and signed URLs | `[~]` | `utils/media.ts`, `signedUrl.ts`, `storage/*`; no acts and no media HTTP server. |
| Local media upload/download | `[ ]` | `utils/storage/local.ts` points at port 1406, but no `http/mediaServer.ts` exists. |
| S3 storage adapter | `[!]` | `aws4fetch` is imported but not declared; S3 env values are absent from `.env.backend.example`. |
| AI gateway and providers | `[~]` | `utils/ai/*` includes schema validation, mock fallback and OpenAI-compatible adapter; type errors remain. |
| AiReview acts | `[ ]` | Placeholder folder only; job handler can process reviews but nothing creates/enqueues them. |
| Job queue/worker | `[~]` | `utils/jobs.ts`, `jobs/worker.ts`, `jobs/handlers.ts`; type errors, no cron schedules, analytics rollup is a no-op. |
| Skill engine | `[~]` | `utils/skillEngine.ts`; no tests and no progress acts. |
| Recommendation and resume engines | `[~]` | `utils/recommendationEngine.ts`, `utils/resumeResolver.ts`; no tests and no acts. |
| Progress/recommendation/achievement acts | `[ ]` | Placeholder folders only. |
| Notification/analytics/audit acts | `[ ]` | Placeholder folders only. |
| Sync (`sync.push` / `sync.pull`) | `[ ]` | `back/src/sync/.gitkeep` only. |
| Admin dashboard and user administration | `[ ]` | No admin acts. |
| Unit tests | `[~]` | Only 4 authz tests; they pass. No domain tests. |
| Integration / API e2e | `[ ]` | `back/http/e2e.json` and `e2e-with-remove.json` are `[]`; no live API run was performed. |
| Docker development setup | `[~]` | `back/Dockerfile`, `docker-compose.dev.yml`; not built in this review. |
| Documentation | `[~]` | Spec and plan exist; README/AGENTS still describe an earlier scaffold state. |
| Web admin / mobile apps | `[ ]` | Not started; explicitly out of scope. |

## C. Completed Work

### Verified

- **Authorization policy unit tests:** `back/utils/authzPolicy.test.ts` covers manager/admin detection, role allow-lists, ghost-scope bypass and scope matching. `deno task test` passed 4/4.
- **Repository baseline:** commit `3b4b352` contains the spec, backend completion plan, models, utilities, auth acts, job/AI/media scaffolding and Docker files.

### Implemented but not runtime-verified

- **Data model:** 27 Lesan models in `back/models/`, including identity, learning content, learner activity, AI/jobs, progress/engagement and operations. See `back/models/mod.ts`.
- **Index bootstrap:** `back/models/indexes.ts` covers unique `operationId` scopes, user history indexes, content indexes, TTL indexes for sessions/analytics and queue indexes.
- **Authentication:** `user.register`, `user.login`, `user.getMe`, `session.refresh`, `session.logout` in `back/src/user` and `back/src/session`.
- **Password/token helpers:** bcrypt hashing, JWT creation, refresh-secret hashing/verification and TTL utilities in `back/utils/tokens.ts`.
- **Auth pipeline:** header parsing, JWT verification, DB user loading, active-role lookup and role gates in `utils/setToken.ts`, `utils/setUser.ts`, `utils/grantAccess.ts`.
- **Domain utilities:** deterministic lab scoring, skill evidence evaluation, recommendation selection, resume resolution, media magic-byte/EXIF detection, signed URL tokens and local/S3 storage adapters.
- **AI layer:** prompt builder, schema validation, truthfulness sanitization, mock provider, OpenAI-compatible provider and provider fallback in `utils/ai/`.
- **Job layer:** idempotent enqueue, atomic lock, retry/backoff, AI review, notification, account-deletion and cleanup handlers in `utils/jobs.ts` and `jobs/`.
- **Docker/config:** multi-stage `back/Dockerfile`, `docker-compose.dev.yml`, `.env.backend.example` and root documentation.

## D. Remaining Work

### 1. Critical bugs and blockers

- [ ] Make `deno task check` pass: 17 type errors in 8 files.
- [ ] Declare the missing `aws4fetch` dependency used by `back/utils/storage/s3.ts`.
- [ ] Make `deno task lint` pass: 2 unused imports.
- [ ] Make `deno fmt --check` pass: 18 unformatted files.
- [ ] Verify the server starts against MongoDB and registers all acts without runtime errors.
- [ ] Resolve the spec path move: the root spec is deleted in the working tree while the copy in `docs/` is untracked; README/AGENTS links are stale.

### 2. Authentication and accounts

- [ ] Implement `user.forgotPassword` and `user.resetPassword` using the existing hash/expiry fields.
- [ ] Implement `user.updateMe` and `user.updateSettings` with owner-only updates.
- [ ] Implement `user.deleteMe` as an authenticated act that revokes sessions and enqueues the account-deletion job.
- [ ] Implement refresh-token reuse detection: reuse of a revoked token must revoke the session chain (spec 14.6).
- [ ] Add request IDs to context and consistent error-to-HTTP mapping.
- [ ] Add integration tests for register → login → refresh → logout and critical account flows.

### 3. Content and admin APIs

- [ ] Wire `registerCrud` for LearningPath, Course, Module, Lesson, Lab, LabScene and LabChallenge.
- [ ] Enforce published-only reads for learners and staff-only draft access.
- [ ] Complete publish validation and the published-content new-version flow.
- [ ] Add admin user reads/status/dashboard acts.
- [ ] Add admin AI-review queue/retry and audit-log reads.
- [ ] Populate `back/http/e2e.json` with real playground flows.

### 4. Learning, labs and practice

- [ ] Implement lesson start/progress/complete acts with ownership and resume resolution.
- [ ] Implement lab attempt add/get/gets/complete with `operationId` idempotency.
- [ ] Implement lab event batch ingestion and lab result creation.
- [ ] Implement deterministic lab scoring through `utils/labScoring.ts` and tests for the spec regression vectors.
- [ ] Implement practice assignment creation from lessons and practice submission.
- [ ] Create `AiReview` + `Job` on submission and expose review retrieval/retry.
- [ ] Add owner checks for attempts, submissions, notes and files.

### 5. Media

- [ ] Implement `file.requestUpload`, `file.completeUpload` and `file.getSignedUrl`.
- [ ] Add the local media HTTP server (`http/mediaServer.ts`) with signed upload/download routes.
- [ ] Make local upload tokens one-time or document the chosen replay protection.
- [ ] Declare S3 configuration, add the missing dependency and verify the S3 adapter.
- [ ] Add media tests for size limits, MIME/magic-byte mismatches, EXIF extraction and signature expiry.

### 6. Progress, engagement and operations

- [ ] Implement skill overview/history and apply evidence from labs, practice and AI reviews.
- [ ] Implement recommendation `getNext` with reason codes and status transitions.
- [ ] Implement achievements and user achievements.
- [ ] Implement owner-scoped, idempotent notes CRUD.
- [ ] Implement notifications with dedupe keys.
- [ ] Implement privacy-aware analytics events and admin audit reads.
- [ ] Implement `sync.push` / `sync.pull` for notes, progress, lab attempts/events and submissions.
- [ ] Replace the no-op analytics rollup and add Deno.cron schedules.
- [ ] Audit account-deletion execution and add dead-letter visibility.

### 7. Testing and production readiness

- [ ] Unit-test lab scoring, skill engine, recommendation, resume, media, signed URLs, AI schema and idempotency.
- [ ] Add API contract/integration tests for every implemented act.
- [ ] Add security tests for cross-user access, published-content edits, revoked refresh tokens and admin authorization.
- [ ] Add CI configuration (currently absent).
- [ ] Build and run the Docker development stack.
- [ ] Update README/AGENTS to match the actual backend state after implementation.

### 8. Frontend and mobile integration

- [ ] Not started and not requested. Do not create `web/` or `mobile/` until the backend is functional and the human partner explicitly asks.

## E. Development Phases

Phases are ordered by dependency, not by arbitrary numbering. Do not start a later phase while its listed dependency is unverified.

### Phase 0 — Green baseline and repository hygiene

**Objective:** Make static checks trustworthy before adding behavior.

**Tasks:**

- [ ] Fix the 17 `deno check` errors and the missing `aws4fetch` dependency.
- [ ] Fix the 2 lint errors and format the 18 files.
- [ ] Decide and commit the spec location; update README/AGENTS links.
- [ ] Decide whether `deno.lock` should be committed (currently ignored by `.gitignore`).
- [ ] Confirm the server starts against a disposable development MongoDB and registers all current acts.

**Dependencies:** None.

**Expected outcome:** A stable baseline where checks pass and the existing five acts can be exercised.

**Acceptance criteria:** `deno task check`, `deno task lint`, `deno fmt --check` and `deno task test` pass; `/playground` loads; no secrets are committed.

**Verification:** Run all four commands, then a smoke test of register/login/getMe/refresh/logout against a disposable database.

### Phase 1 — Authentication and account completion

**Objective:** Complete the identity contract in spec sections 2.3, 14.6 and 16.2.

**Tasks:**

- [ ] Add forgot/reset password, updateMe, updateSettings and deleteMe.
- [ ] Add refresh-token reuse detection and session-chain revocation.
- [ ] Add request IDs and consistent error mapping.
- [ ] Decide email-verification/reset-email delivery; never expose reset tokens in production responses.
- [ ] Add critical account integration tests.

**Dependencies:** Phase 0; job queue for account deletion.

**Expected outcome:** A complete account lifecycle with verified authorization and session behavior.

**Acceptance criteria:** Register → login → refresh → logout, password reset, settings update and account deletion all pass API tests; revoked refresh reuse is rejected and revokes the chain.

**Verification:** Integration tests plus manual playground calls against a disposable database.

### Phase 2 — Content and admin acts

**Objective:** Expose the versioned learning content through Lesan and make the admin CMS usable.

**Tasks:**

- [ ] Wire `registerCrud` for all seven content models and the skill/achievement reference data.
- [ ] Configure learner reads as Published-only.
- [ ] Implement publish validation and a clone/new-version flow for published content.
- [ ] Add admin user, dashboard, AI-review and audit endpoints.
- [ ] Populate playground e2e collections.

**Dependencies:** Phase 0; Phase 1 for admin identity/authorization.

**Expected outcome:** Content can be created, edited, published and read with correct role and status rules.

**Acceptance criteria:** A Learner cannot see drafts or edit content; ContentEditor/Admin can manage drafts; published content cannot be edited in place; every admin mutation writes an audit log.

**Verification:** API tests for role/status combinations and immutable published content; audit-log inspection.

### Phase 3 — Learning, labs and deterministic scoring

**Objective:** Implement the core learn → experiment loop.

**Tasks:**

- [ ] Lesson progress start/update/complete using `resolveResume`.
- [ ] Lab attempt, event and result acts with idempotency.
- [ ] Deterministic scoring through `labScoring.ts`, including all spec 25.2 regression vectors.
- [ ] Challenge evaluation and pass/fail states.
- [ ] Ownership checks for every user-scoped record.

**Dependencies:** Phase 2 (published content).

**Expected outcome:** A learner can progress through lessons, run labs and receive deterministic results.

**Acceptance criteria:** Duplicate `operationId` returns the original result; lab metrics match the regression vectors; cross-user access is denied; published content version is stored with attempts.

**Verification:** Unit tests for lab math and resume, integration tests for lesson/lab flows, security tests for ownership.

### Phase 4 — Media, practice and AI review

**Objective:** Implement photo submission and asynchronous AI critique.

**Tasks:**

- [ ] File request/complete/signed-url acts.
- [ ] Local media server and S3 configuration.
- [ ] Practice assignment creation, submission and media attachment.
- [ ] Create `AiReview` + `Job` on submit; enforce AI quota and privacy consent.
- [ ] AI review retrieval/retry and status transitions.

**Dependencies:** Phase 3; Phase 0 (S3 dependency/config).

**Expected outcome:** A learner can upload a photo, submit practice and receive a validated AI review.

**Acceptance criteria:** Invalid file types are rejected; private media requires a valid signed URL; duplicate submissions are idempotent; AI keys never reach clients; AI output is schema-validated.

**Verification:** Media unit tests, API integration tests, job-worker test with the mock provider, and a manual upload/download flow.

### Phase 5 — Notes, progress, recommendations and engagement

**Objective:** Complete the learner's persistent notebook and progress loop.

**Tasks:**

- [ ] Owner-scoped notes CRUD with pin/search/filter.
- [ ] Skill overview/history and evidence application.
- [ ] Recommendation `getNext` with reason-code explanations.
- [ ] Achievements and user achievements.
- [ ] Notifications with dedupe keys.

**Dependencies:** Phase 3 and Phase 4 for evidence sources.

**Expected outcome:** Notes, mastery state, recommendations and achievements reflect real activity.

**Acceptance criteria:** Notes are private and idempotent; skill state changes only from evidence; recommendations explain why they were chosen; duplicate notifications are suppressed.

**Verification:** Unit tests for engines, integration tests for notes/progress, and security tests for note ownership.

### Phase 6 — Sync, analytics, audit and operations

**Objective:** Close the offline-first and operations loop.

**Tasks:**

- [ ] `sync.push` / `sync.pull` with per-operation ack/duplicate/rejected results.
- [ ] Privacy-aware analytics events and admin audit reads.
- [ ] Deno.cron schedules for cleanup, account deletion, notification dispatch and analytics rollup.
- [ ] Replace the no-op analytics rollup.
- [ ] Dead-letter job visibility and account-deletion audit.

**Dependencies:** Phases 3–5.

**Expected outcome:** Offline mutations can be replayed safely and operational jobs run on schedule.

**Acceptance criteria:** Duplicate sync operations do not duplicate records; pull returns only the user's data plus new published content; cron schedules are registered; dead jobs are inspectable by admins.

**Verification:** Sync integration tests, worker/retry tests, and a cron smoke test with disposable data.

### Phase 7 — Verification and production readiness

**Objective:** Prove the backend meets the spec's Definition of Done.

**Tasks:**

- [ ] Complete the test matrix in spec section 25.
- [ ] Run the full API contract suite and security suite.
- [ ] Build and start the Docker stack.
- [ ] Add CI.
- [ ] Update generated declarations, playground collections and documentation.
- [ ] Review secrets, logging, rate limits, quotas and retention.

**Dependencies:** All preceding phases.

**Expected outcome:** A verified backend suitable for mobile and admin integration.

**Acceptance criteria:** All static checks and tests pass; Docker starts; spec acceptance criteria are covered; no secrets or private media are exposed.

**Verification:** CI run, Docker run, API e2e run and a final security review.

### Phase 8 — Frontend and mobile integration

**Objective:** Connect the Android app and admin portal once the backend is stable.

**Dependencies:** Phase 7 and explicit human approval.

**Status:** Out of scope for now. Do not start `web/` or `mobile/`.

## F. Immediate Next Steps

### 1. Restore a green static baseline

- **What:** Add `aws4fetch` to the import map, fix all 17 type errors, remove 2 unused imports and format 18 files.
- **Why:** Nothing built on a failing type check can be considered verified; this is the first blocker for every other task.
- **Likely files:** `back/deno.json`, `back/utils/storage/s3.ts`, `back/utils/content.ts`, `back/utils/crud.ts`, `back/utils/media.ts`, `back/utils/ai/gateway.ts`, `back/utils/ai/schema.ts`, `back/jobs/handlers.ts`, `back/jobs/worker.ts`, `back/models/lessonProgress.ts`, `back/models/notification.ts`.
- **Verify:** `deno task check`, `deno task lint`, `deno fmt --check` and `deno task test` all pass.

### 2. Wire content CRUD and published-only reads

- **What:** Call `registerCrud` for the seven content models, configure learner/staff roles and published-only behavior, and add a minimal publish flow.
- **Why:** It unlocks the learner content API, the future admin CMS and the data that lessons/labs depend on.
- **Likely files:** `back/src/mod.ts`, new `back/src/learningPath`, `course`, `module`, `lesson`, `lab`, `labScene`, `labChallenge` acts, `back/utils/crud.ts`, `back/utils/content.ts`.
- **Verify:** Start against a disposable Mongo, create/publish content through the playground, confirm a Learner cannot see drafts, and confirm published edits are rejected.

### 3. Complete the missing account acts

- **What:** Add forgot/reset password, updateMe, updateSettings and deleteMe; make deletion enqueue the existing account-deletion job.
- **Why:** The account contract is incomplete and blocks realistic mobile onboarding and the critical account tests.
- **Likely files:** `back/src/user/*`, `back/models/user.ts`, `back/utils/jobs.ts`, `back/jobs/handlers.ts`, `back/http/e2e.json`.
- **Verify:** Register → login → reset password → update settings → delete account; old sessions are revoked; the deletion job is auditable.

### 4. Implement file/media acts and the local media server

- **What:** Add `file.requestUpload`, `file.completeUpload`, `file.getSignedUrl` and the local HTTP routes used by `utils/storage/local.ts`.
- **Why:** Practice submission and AI review cannot work without a verifiable upload/download path.
- **Likely files:** new `back/src/file/*`, new `back/http/mediaServer.ts`, `back/mod.ts`, `back/utils/media.ts`, `back/utils/signedUrl.ts`, `back/utils/storage/*`, `back/.env.backend.example`.
- **Verify:** Upload a valid JPEG, reject an oversized or MIME-mismatched file, download through a signed URL, and confirm an expired/invalid token fails.

### 5. Implement lesson and lab acts with tests

- **What:** Add lesson progress and lab attempt/event/result acts and cover resume and deterministic scoring with unit tests.
- **Why:** This is the core product loop and the first place the existing domain utilities become reachable through the API.
- **Likely files:** `back/src/lessonProgress/*`, `back/src/labAttempt/*`, `back/src/labEvent/*`, `back/src/labResult/*`, `back/utils/labScoring.ts`, `back/utils/resumeResolver.ts`, new tests under `back/utils/`.
- **Verify:** Lesson resume restores the correct block; duplicate lab operations are idempotent; all spec 25.2 vectors pass.

## G. Known Issues and Blockers

### Confirmed

- **Static type checking fails:** `deno task check` reports 17 errors in 8 files. Major causes:
  - missing `aws4fetch` dependency (`utils/storage/s3.ts:2`);
  - `errorDiagnostics: null` not assignable to `string | undefined` (`jobs/handlers.ts:194`);
  - `lockNextJob` returns a broad document not assignable to `LockedJob` (`jobs/worker.ts:21`);
  - missing return after `throwError` (`utils/ai/gateway.ts:43`, `utils/media.ts:160`);
  - `value.summary` remains `unknown` (`utils/ai/schema.ts:38`);
  - nullable document narrowing in `utils/content.ts:27-42`;
  - nullable/unknown typing in `utils/crud.ts:75,90,288,330,532,539`;
  - `Uint8Array` not assignable to `BodyInit` in `utils/storage/s3.ts:80`.
- **Lint fails:** unused `string` in `models/lessonProgress.ts:10` and unused `defaulted` in `models/notification.ts:4`.
- **Formatting fails:** `deno fmt --check` reports 18 unformatted files out of 89.
- **Only one test file exists:** `utils/authzPolicy.test.ts` (4 tests, passing). No tests for lab scoring, skill engine, recommendations, resume, media, signed URLs, AI schema, idempotency, acts or authorization boundaries.
- **The act layer is mostly empty:** only 5 acts are registered (`register`, `login`, `getMe`, `refresh`, `logout`); 25 `src/` domain folders contain only `.gitkeep`.
- **`registerCrud` is unused:** `utils/crud.ts` defines a full generic factory but `src/mod.ts` never calls it.
- **No media server:** `utils/storage/local.ts` builds URLs on `MEDIA_PORT` (default 1406), but no HTTP server exists to serve them.
- **S3 is not usable:** `aws4fetch` is not declared; S3-related variables are absent from `.env.backend.example`.
- **No cron schedules:** `jobs/worker.ts` starts a polling loop from `mod.ts`, but there is no `Deno.cron` and nothing enqueues cleanup/analytics/notification/account-deletion jobs automatically.
- **Analytics rollup is a no-op:** `jobs/handlers.ts:314`.
- **`jobs/mod.ts` is a placeholder:** `startWorker` is exported but unused; the real worker is `jobs/worker.ts`.
- **Empty e2e collections:** `back/http/e2e.json` and `back/http/e2e-with-remove.json` contain `[]`.
- **Missing auth acts:** forgot/reset password, updateMe, updateSettings and deleteMe are absent.
- **Refresh-token reuse chain is not implemented:** a revoked refresh token is rejected, but the session chain is not revoked as required by spec 14.6.
- **Account deletion is not exposed or audited:** the handler soft-deletes user/session/note/file state but no act calls it and no audit entry is written.
- **No request ID layer:** spec 16.1 requires request IDs; none is implemented.
- **No CI configuration:** no workflow files were found.
- **Documentation drift:** `README.md` and `back/AGENTS.md` still describe only User/Session/File and a scaffold stage, while the repository has 27 models and broad utilities.
- **Spec path drift:** working tree shows root `CAMAI_Complete_Master_Specification_v4_1_Lesan_EN.md` deleted and `docs/CAMAI_Complete_Master_Specification_v4_1_Lesan_EN.md` untracked. README/AGENTS links point at the deleted root path.
- **`deno.lock` is gitignored:** dependency resolution is not pinned in version control.
- **`Note` contract naming mismatch:** spec 4.4 uses `isPinned` and `clientOperationId`; spec 14.5/15.1 use `pinned`; the model uses `isPinned` and `operationId`. Pick one public contract before implementing note acts.

### Suspected / not yet verified

- **Lesan error mapping:** `AppError` exists, but no code verifies that Lesan returns the intended HTTP status/body for thrown `CODE: message` errors.
- **Local upload token is replayable:** the signed token has an expiry but no one-time nonce consumption; the missing media server may or may not enforce single use.
- **S3 signed URL TTL:** `s3.ts` hardcodes `X-Amz-Expires=900` instead of using the requested `ttlSeconds`.
- **Index bootstrap runtime:** indexes are created at startup, but conflicts/idempotency with model-level `createIndex` settings have not been exercised.
- **Model relation behavior:** one-directional relations, embedded snapshots and exclusion behavior have not been runtime-tested.
- **Docker build:** Dockerfiles and compose config exist but were not built in this review.
- **Concurrent idempotency:** `enqueueJob` catches all insert failures and returns an existing job by key; race/error semantics are untested.
- **AI privacy consent:** `settings.privacy.aiProcessingConsent` exists, but `runAiReview` does not check it.

## H. Technical Decisions

| Decision | Rationale | Implementation | Open questions |
|---|---|---|---|
| Deno + Lesan + MongoDB, one `POST /lesan` API | Spec-mandated stack; model and API definitions stay together. | `back/mod.ts`, `back/models/`, `back/src/`. | None. |
| Models own persistence; acts validate and route; domain math in `utils/` | Testability and reuse; prevents business logic in endpoints. | `back/utils/`, act folders. | None. |
| One-directional Lesan relations with child-side `relatedRelations` | Avoids duplicated relations and inconsistent reverse arrays. | All model relation definitions. | Validate runtime behavior during Phase 0/2. |
| Access JWT + rotating, hashed refresh tokens | Short-lived access and revocable sessions. | `utils/tokens.ts`, `src/session/`. | Add revoked-chain reuse detection. |
| `activeRoleId` in every authenticated set; role gate + DB ownership | Client-supplied scope IDs are untrusted. | `utils/grantAccess.ts`, `utils/scope.ts`, `utils/authzPolicy.ts`. | Add attempt/submission-specific ownership helpers. |
| Generic `registerCrud` factory for standard acts | Avoids repeating add/get/gets/update/remove/publish logic. | `utils/crud.ts`. | Wire it; decide per-model roles/filters/validation. |
| Published content immutable; edits create new versions | Preserves historical learning meaning. | `utils/content.ts`, `models/content.ts`, `crud.ts`. | Clone/new-version workflow is not implemented. |
| `operationId` + unique indexes for retryable writes | Idempotent mobile sync and retries. | `models/indexes.ts`, model fields. | No acts currently use it; `utils/idempotency.ts` does not exist. |
| MongoDB-backed job queue with atomic lock and backoff | Simple infrastructure; Redis can replace it later behind the same interface. | `utils/jobs.ts`, `jobs/worker.ts`. | Add cron scheduling, admin dead-letter view and tests. |
| Storage adapter (local or S3) behind a common interface | Local development and private production storage. | `utils/storage/*`. | Fix S3 dependency/config; add media server. |
| AI providers behind adapters with mock fallback and schema validation | Keys stay server-side; deterministic development path. | `utils/ai/*`. | Enforce consent/quota at act level; add tests. |
| Errors use `CODE: message` through `AppError` | Stable client-facing error codes. | `utils/throwError.ts`. | Verify Lesan HTTP mapping. |
| Notes use `isPinned` and `operationId` in the model | Current code choice. | `models/note.ts`. | Spec uses both `pinned`/`isPinned` and `clientOperationId`/`operationId`; confirm the public contract. |

## I. Testing and Verification

### Available commands

```bash
cd back
deno task dev      # watch mode; starts server and job worker
deno task start    # run once
deno task check    # deno check mod.ts
deno task test     # deno test --allow-all
deno task fmt
deno task lint
```

For formatting verification without changing files, use `deno fmt --check`.

### Results observed on 2026-10-27

| Check | Result | Evidence |
|---|---|---|
| `deno task check` | **FAIL** | 17 type errors in 8 files. |
| `deno task lint` | **FAIL** | 2 unused-import errors. |
| `deno fmt --check` | **FAIL** | 18 files not formatted out of 89. |
| `deno task test` | **PASS (limited)** | 4/4 authz tests passed in 41 ms. |
| Server runtime | **NOT RUN** | Avoided starting because it creates indexes and starts the worker; Mongo port 27017 was open but untouched. |
| Docker build | **NOT RUN** | No build performed. |
| API e2e | **NOT RUN** | e2e JSON files are empty. |

### Coverage gaps

- No tests for `labScoring.ts`, `skillEngine.ts`, `recommendationEngine.ts`, `resumeResolver.ts`, `media.ts`, `signedUrl.ts`, `ai/schema.ts`, `ai/truthfulness.ts`, `jobs.ts` or storage adapters.
- No tests for registration/login/refresh/logout, ownership enforcement, published-content immutability, idempotency or admin authorization.
- No integration/database tests, no API contract tests, no security tests and no CI.

### Required verification before a task is considered complete

1. The relevant unit tests exist and pass.
2. `deno task check`, `deno task lint` and `deno fmt --check` pass.
3. The changed act is exercised through `POST /lesan` against a disposable development database.
4. Authorization is tested for both allowed and denied roles/owners.
5. No secret, password hash, refresh hash or storage key appears in a response or relation.
6. Documentation and this roadmap's status are updated with evidence.

## J. Session Handoff and Resume Instructions

### Read these first

1. This file (`docs/superpowers/plans/2026-10-27-camai-development-roadmap.md`), especially sections B, D and F.
2. Relevant spec sections in `docs/CAMAI_Complete_Master_Specification_v4_1_Lesan_EN.md`:
   - 14.4–14.9 for backend rules, auth, jobs, media and domain logic;
   - 15 for models/relations/indexes;
   - 16 for the API contract;
   - 25 for tests;
   - 31 and 33 for Definition of Done and implementation order.
3. `docs/superpowers/plans/2026-10-27-camai-backend-completion.md` for the task breakdown.
4. `back/AGENTS.md` and root `AGENTS.md` for conventions.
5. Inspect `back/mod.ts`, `back/models/mod.ts`, `back/src/mod.ts`, `back/utils/crud.ts`, `back/utils/authzPolicy.ts` and the act folder you are changing.

### Current state

- The model/utility foundation is broad, but only five auth/session acts are registered.
- Static checks fail; do not assume the current tree is runnable.
- No act currently exercises `registerCrud`, lab scoring, media storage, AI reviews, progress, recommendations, notifications, analytics, audit or sync.
- The test suite is effectively the four authorization-policy tests.

### Next task

Start with **Phase 0 / Immediate Next Step 1**: restore a green static baseline. Do not add domain acts until `deno task check`, `deno task lint`, `deno fmt --check` and `deno task test` pass.

After that, proceed with the existing completion plan: content/identity acts, then learning/labs/practice, then progress/engagement, then workers/media/sync, then the full verification phase.

### Dependencies and blockers to resolve first

- Missing `aws4fetch` dependency and S3 configuration.
- Type errors in `crud.ts`, `content.ts`, `media.ts`, AI gateway/schema, job handlers/worker and S3 adapter.
- No media HTTP server, so local upload/download cannot be verified.
- No content acts, so learner content and labs have no API surface.
- No integration test harness or populated playground collections.

### Before moving to the next phase

- Run `deno task check`, `deno task lint`, `deno fmt --check` and `deno task test`.
- Exercise the newly added act through `/lesan` against a disposable database.
- Add or update relevant tests.
- Update the status table and progress log in this file.

## K. Progress Log

- **2026-10-27** — Commit `3b4b352` (`✨ feat: bootstrap CAMAI project scaffold with docs and Deno/Lesan backend`) added the spec, backend completion plan, 27 models, domain utilities, five auth/session acts, jobs/AI/media scaffolding and Docker files.
- **2026-10-27** — Working tree contains an uncommitted spec move: root spec deleted, `docs/CAMAI_Complete_Master_Specification_v4_1_Lesan_EN.md` untracked. No application code was changed during this roadmap review.
- **2026-10-27** — Verification: `deno task check` failed with 17 errors; `deno task lint` failed with 2 errors; `deno fmt --check` reported 18 unformatted files; `deno task test` passed 4/4 authz tests. Server, Docker and API e2e were not run.

## Maintenance Rules for Future Sessions

1. Read this file and the relevant `AGENTS.md` instructions before substantial work.
2. Inspect the current code; never trust this roadmap blindly.
3. Verify a task is still relevant and not already completed before implementing it.
4. After completing a task, update its status and record concrete evidence (file path, command, test result).
5. Keep partially completed work marked `[~]`; do not promote it without verification.
6. If checks or tests were not run, do not mark the task completed.
7. Record new blockers, contract changes and architectural decisions in this file.
8. Refresh the Immediate Next Steps whenever priorities change.
9. Keep the progress log concise; preserve milestones, not every edit.
10. Keep this file synchronized with the repository, and never include secrets or sensitive environment values.
