# Interview Platform

Monorepo for an AI-assisted hiring platform:

| Path | Description |
| --- | --- |
| `apps/company-portal` | Company dashboard (jobs, candidates, interviews, settings) |
| `apps/interview-portal` | Candidate interview experience |
| `api/hiring_service` | Primary backend API (Express + PostgreSQL) |
| `packages/*` | Shared UI, theme, and HTTP client |

## Prerequisites

- **Node.js** 20+
- **pnpm** 9+ (`corepack enable` then `corepack prepare pnpm@9.0.0 --activate`)
- **PostgreSQL** (local or remote)
- **[dbmate](https://github.com/amacneil/dbmate)** for database migrations

## 1. Install dependencies

From the repo root (frontends + shared packages):

```bash
pnpm install
```

API is outside the pnpm workspace, so install it separately:

```bash
cd api/hiring_service
pnpm install
```

## 2. Configure environment

### Backend (`api/hiring_service`)

```bash
cp api/hiring_service/.env.example api/hiring_service/.env
```

Edit `.env` and set at least:

- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — each ≥ 32 characters
- `FRONTEND_URL` — company portal origin (default Vite: `http://localhost:5173`)
- Google / Microsoft SSO values if you use social login

### Frontends

```bash
cp .env.example apps/company-portal/.env
cp .env.example apps/interview-portal/.env
```

Keep only the relevant `VITE_*` variable in each file. Both portals should point at the hiring service:

```env
VITE_COMPANY_API_BASE_URL=http://localhost:3000
VITE_INTERVIEW_API_BASE_URL=http://localhost:3000
```

## 3. Database

Create the database (name should match `DATABASE_URL`), then run migrations:

```bash
cd api/hiring_service
pnpm db:migrate
```

Useful commands:

```bash
pnpm db:status
pnpm db:rollback
pnpm db:new migration_name
```

## 4. Run locally

Use **three terminals** from the paths below.

### API (port `3000`)

```bash
cd api/hiring_service
pnpm dev
```

Swagger UI: [http://localhost:3000/api-docs](http://localhost:3000/api-docs).

### Company portal (Vite, usually `5173`)

From the **repo root**:

```bash
pnpm dev:company
```

Open [http://localhost:5173](http://localhost:5173).

### Interview portal

From the **repo root**:

```bash
pnpm dev:interview
```

Vite will pick the next free port (often `5174`) if `5173` is already in use.

## Git hooks (Husky)

After `pnpm install` at the repo root, Husky installs a **pre-commit** hook that runs `pnpm lint`.

`api/hiring_service` has the same setup (`prepare` → Husky → `pnpm lint`) for when it lives in its own repo.

If root hooks are missing:

```bash
pnpm prepare
```

## Other scripts

| Command | Where | What it does |
| --- | --- | --- |
| `pnpm build` | root | Build all workspace packages/apps |
| `pnpm lint` | root | Lint apps + packages |
| `pnpm lint:fix` | root | Auto-fix lint issues |
| `pnpm format` | root | Format with Prettier |
| `pnpm build` / `pnpm start` | `api/hiring_service` | Production build + run |

## Project layout

```text
interview-platform/
├── apps/
│   ├── company-portal/     # React + Vite company app
│   └── interview-portal/   # React + Vite interview app
├── api/
│   └── hiring_service/     # Express API + dbmate migrations
├── packages/
│   ├── http-client/
│   ├── theme/
│   └── ui/
├── .husky/                 # Git hooks (pre-commit → pnpm lint)
├── .editorconfig           # LF + indent defaults
├── eslint.config.mjs
├── package.json
└── pnpm-workspace.yaml
```

## Troubleshooting

- **API exits on start** — check required env vars in `api/hiring_service/src/config/env.ts` (missing `DATABASE_URL` / JWT / SSO / `FRONTEND_URL`).
- **Frontend calls fail / wrong host** — confirm portal `.env` points to `http://localhost:3000` and restart Vite after changing env.
- **`pnpm dev:company` not found** — run it from the **repo root**, not from `api/hiring_service`.
- **Pre-commit fails** — fix ESLint issues, or run `pnpm lint` to reproduce locally.
- **Wrong line endings** — repo uses LF (`.editorconfig` / `.gitattributes` / VS Code `files.eol`).
