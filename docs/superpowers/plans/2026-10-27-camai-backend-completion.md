# CAMAI Backend Completion Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the CAMAI Deno + Lesan backend so every documented domain has working models, acts, authorization, idempotency, jobs, media, AI gateway and sync.

**Architecture:** Lesan models own persistence and relations; acts validate and delegate to pure utilities. A generic CRUD factory supplies standard content/admin acts while custom acts cover auth, learning progress, labs, practice, media, AI, progress, recommendations, notifications, analytics, audit, admin and sync.

**Tech Stack:** Deno 2, TypeScript strict, Lesan 0.2.3, MongoDB, djwt, bcrypt.

**Spec:** `docs/CAMAI_Complete_Master_Specification_v4_1_Lesan_EN.md`

## Global Constraints

- Every authenticated `set` includes `activeRoleId`; server derives ownership from DB rows.
- Roles: `Manager`, `Admin`, `ContentEditor`, `Reviewer`, `Learner`.
- Published learning content is immutable; edits require a new version.
- Retryable writes use `operationId` and unique indexes.
- Never expose passwords, refresh hashes, reset hashes or storage keys.
- Private media uses short-lived signed URLs.
- AI provider keys stay in backend env; provider calls stay behind adapters.
- Domain math lives in `utils/`, not acts.
- No relation may be defined on both sides.
- No unbounded reverse relation arrays.
- Errors use `CODE: message`.
- `web/` and `mobile/` stay untouched.

## Tasks

### Task 1: Domain models and indexes

**Files:** `models/*.ts`, `models/mod.ts`, `models/indexes.ts`, `models/excludes.ts`

Build every model from spec sections 15.1–15.3: learning content, learner activity, AI/jobs, progress, operations. Add unique operation indexes, user history indexes, queue indexes, TTL indexes and content indexes. Export all factories from `models/mod.ts`.

### Task 2: Shared utilities

**Files:** `utils/errors.ts`, `utils/content.ts`, `utils/scope.ts`, `utils/idempotency.ts`, `utils/audit.ts`, `utils/labScoring.ts`, `utils/skillEngine.ts`, `utils/recommendationEngine.ts`, `utils/resumeResolver.ts`, `utils/media.ts`, `utils/signedUrl.ts`, `utils/storage/*`, `utils/ai/*`, `utils/jobs.ts`, `utils/crud.ts`

Add structured errors, Published-content guards, ownership helpers, idempotent insert helper, audit writer, deterministic camera math, mastery calculation, recommendation selection, resume resolution, media validation/metadata, signed URL tokens, local/S3 storage adapters, AI gateway with mock/fallback providers and schema validation, job queue helpers, and a reusable Lesan CRUD act factory.

### Task 3: Content and identity acts

**Files:** `src/learningPath/*`, `src/course/*`, `src/module/*`, `src/lesson/*`, `src/lab/*`, `src/labScene/*`, `src/labChallenge/*`, `src/skill/*`, `src/achievement/*`, `src/user/*`, `src/session/*`

Register CRUD and publish acts for content; add forgot/reset password, updateMe, updateSettings, deleteMe, admin user reads/status/dashboard. Keep login/session behavior and refresh rotation.

### Task 4: Learning, labs and practice

**Files:** `src/lessonProgress/*`, `src/labAttempt/*`, `src/labEvent/*`, `src/labResult/*`, `src/practiceAssignment/*`, `src/practiceSubmission/*`, `src/aiReview/*`, `src/note/*`

Implement resume state, lesson completion, deterministic Lab scoring, event batches, practice assignment/submission, AI review creation/queueing/retrieval, and owner-scoped notes.

### Task 5: Progress, engagement and operations

**Files:** `src/skillProgress/*`, `src/recommendation/*`, `src/userAchievement/*`, `src/notification/*`, `src/analyticsEvent/*`, `src/auditLog/*`, `src/sync/*`

Implement skill overview/history, next recommendation with reasonCode, achievements, idempotent notifications, privacy-aware analytics, admin audit reads, and push/pull sync for notes, progress, lab attempts/events and submissions.

### Task 6: Workers, media server and wiring

**Files:** `jobs/*`, `http/mediaServer.ts`, `mod.ts`, `src/mod.ts`, `.env.backend.example`, `docker-compose.dev.yml`, `Dockerfile`

Start an atomic MongoDB job worker, handle AI review/notification/account deletion/cleanup jobs, expose signed local media upload/download routes, wire every setup function, and document new env values.

### Task 7: Verification

**Files:** `utils/*.test.ts`

Unit-test lab math monotonicity, mastery transitions, recommendation/resume, media magic bytes and signed tokens. Run format, lint, check, tests, then exercise register/login/content/lab/practice/note/progress/media/sync through the live API and clean test data.
