# CAMAI

CAMAI is a photography learning and intelligent shooting platform: Smart Camera guidance, structured lessons, interactive Photo Labs, real-world practice, AI critique, personal notes and progress tracking.

The product contract is defined in [`CAMAI_Complete_Master_Specification_v4_1_Lesan_EN.md`](./CAMAI_Complete_Master_Specification_v4_1_Lesan_EN.md).

## Stack

- Backend: Deno + Lesan + MongoDB
- Web Admin: Next.js (planned)
- Mobile: Kotlin + Jetpack Compose (planned)

## Backend Quick Start

```bash
cp .env.backend.example .env.backend
cd back
deno task dev
```

The API runs on `http://localhost:1405` and the Lesan playground is available at `http://localhost:1405/playground` in development.

### Docker

```bash
cp .env.backend.example .env.backend
docker compose -f docker-compose.dev.yml up --build
```

## Repository Layout

```text
camai/
├── back/      # Deno + Lesan backend
├── web/       # Next.js admin portal (planned)
├── mobile/    # Android app (planned)
└── ignore-scripts/
```

## Status

This repository is at the scaffold stage. The backend foundation includes user, session and file models plus authentication and shared authorization utilities. The CAMAI learning, Photo Lab, practice, AI, progress and sync domains come next.
