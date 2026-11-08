# CAMAI - Full-Stack Application

## Project Overview

CAMAI is a photography learning and intelligent shooting platform. It combines a Smart Camera with structured lessons, interactive Photo Labs, real-world practice, AI photography critique, personal notes, account synchronization and progress tracking.

The implementation contract is the master specification in this repository:

- `docs/CAMAI_Complete_Master_Specification_v4_1_Lesan_EN.md`

Read the relevant sections of that specification before implementing any product behavior.

## Architecture

- **Backend:** Deno + Lesan (MongoDB ODM and web framework) + TypeScript
- **Database:** MongoDB
- **Jobs / cache:** MongoDB-backed Job collection and Deno workers; Redis is optional later behind the same interface
- **Object storage:** storage adapter with local `back/uploads/` in development and S3-compatible private storage in production
- **Web Admin:** Next.js + TypeScript (planned; do not start yet)
- **Mobile:** Kotlin + Jetpack Compose + Clean Architecture (planned; do not start yet)
- **Authentication:** short-lived access JWT + rotating refresh token stored hashed in `Session`
- **Authorization:** role gates plus DB-derived ownership/scope checks

## Repository Structure

```text
camai/
├── AGENTS.md
├── README.md
├── docs/CAMAI_Complete_Master_Specification_v4_1_Lesan_EN.md
├── .env.backend.example
├── docker-compose.dev.yml
├── back/                 # Deno + Lesan backend
│   ├── deno.json
│   ├── mod.ts
│   ├── Dockerfile
│   ├── models/
│   ├── src/
│   ├── utils/
│   ├── jobs/
│   ├── http/
│   ├── uploads/
│   └── scripts/migrations/
├── web/                  # Next.js admin portal (planned)
├── mobile/               # Android app (planned)
└── ignore-scripts/       # Untracked ad-hoc scripts
```

## Current Status

The repository currently contains the project scaffold and backend foundation:

- Root project documentation and development configuration
- Deno + Lesan backend wiring
- MongoDB connection and generated type declarations
- `User`, `Session` and `File` models
- Registration, login, refresh, logout and `getMe`
- Shared auth, token, role and scope utilities
- Placeholder directories for the CAMAI domain modules

The learning, Photo Lab, practice, AI, progress, analytics, notification, admin and sync domains are implemented in the next step. Do not build `web/` or `mobile/` until explicitly requested.

## Building and Running

### Docker development

```bash
cp .env.backend.example .env.backend
docker compose -f docker-compose.dev.yml up --build
```

The development setup exposes:

- Backend API: `http://localhost:1405`
- Lesan playground: `http://localhost:1405/playground`
- MongoDB: `localhost:27017`

### Manual development

Backend:

```bash
cd back/
deno task dev
```

Useful backend tasks:

```bash
deno task check
deno task fmt
deno task lint
deno task test
```

## Environment Configuration

Backend environment variables live in `.env.backend` at the project root. Start from `.env.backend.example`.

Important variables:

- `MONGO_URI`
- `MONGO_DB`
- `ENV`
- `APP_PORT`
- `TOKEN_KEY`
- `ACCESS_TOKEN_TTL_SECONDS`
- `REFRESH_TOKEN_TTL_DAYS`
- `STORAGE_DRIVER`
- `UPLOAD_DIR`
- `AI_PROVIDER_A_KEY`
- `AI_PROVIDER_B_KEY`
- `AI_DAILY_QUOTA`

Never commit real secrets. AI provider keys exist only in backend environment variables.

## Development Conventions

### Backend

- Uses Lesan for API generation and MongoDB data modeling.
- TypeScript is strict.
- Registrations and validators use the Lesan validator syntax.
- Relations are one-directional and defined on the owning/child model only.
- Each act lives in its own folder with `mod.ts`, `[action].fn.ts` and `[action].val.ts`.
- Acts validate and route; domain logic belongs in `utils/`.
- Every user-scoped query must enforce ownership or scope.
- Every mutation that can be retried must be idempotent through an operation ID.
- Published learning content is immutable.
- Never expose passwords, refresh token hashes or storage keys through relations.
- Provider SDKs stay behind adapters in `utils/ai/providers`.

See `back/AGENTS.md` for the detailed backend patterns and the master specification for product contracts.

### Web Admin and Mobile

Do not create or modify `web/` or `mobile/` until the backend is functional and the human partner asks for them.

## Scripting Conventions

Any ad-hoc scripts (data entry, migration, or automation scripts) **must** be placed in the `ignore-scripts/` folder at the project root. This folder is listed in `.gitignore` so scripts are never accidentally committed.

Example: `ignore-scripts/seed_camai.ts` run from the project root.

## Git Commit Instructions

When the human partner says `git commit`, act as an expert Git commit assistant:

- Carefully review the recent changes (for example with `git diff` or staged files).
- Generate clear conventional commit messages with a Gitmoji at the start.
- Use the structure: Gitmoji, type, optional scope, colon, concise description.
- Group changes into logical, atomic commits instead of one large commit.
- Include a body when needed and reference issues when relevant.
- Execute the necessary `git add` and `git commit` commands directly without asking for confirmation.
- Only create new commits on the current branch. Do not rebase, squash or amend existing commits.
- Keep subjects imperative, concise and descriptive.
- Use present tense, for example `Add feature`, not `Added feature`.
- Mark breaking changes with `!`, for example `feat!: Remove deprecated endpoint`.
- Update dependency commits with the specific package names.
- Explain configuration changes in the commit body.

⚠️ **WARNING:** Never use `git reset` during git operations. It can permanently erase work.
