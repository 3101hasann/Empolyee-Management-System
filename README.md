# EMS — Employee Management System

Internee management for DijitalBrains: batches, internees, tenures, and (upcoming) attendance. Dark-themed admin panel built from the EMS Figma design.

**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Prisma 7 · MySQL 8 · Auth.js v5 (JWT) · Tailwind CSS 4 · shadcn/ui (Base UI) · Zod 4 · React Hook Form

> **AI agents:** read [`AGENTS.md`](AGENTS.md) and [`docs/DESIGN.md`](docs/DESIGN.md) before writing any code. See [Notes for AI agents](#notes-for-ai-agents) below.

---

## Prerequisites

| Requirement | Version | Notes |
| --- | --- | --- |
| Node.js | 20+ | |
| MySQL server | 8.x | Running and reachable before you migrate/seed. A local install, XAMPP/WAMP, or a Docker container all work. |
| npm | comes with Node | |

You do **not** need to create the database yourself — `prisma migrate dev` creates `ems_db` if it doesn't exist (the MySQL user needs `CREATE` privilege for that).

## Setup (fresh clone)

### 1. Install dependencies

```bash
npm install
```

`postinstall` automatically runs `prisma generate`, which writes the Prisma client to `src/generated/prisma/`. That folder is generated code — never edit it, and regenerate it after any schema change.

### 2. Configure environment

```bash
cp .env.example .env   # PowerShell: Copy-Item .env.example .env
```

Then fill in `.env`:

| Variable | What to put there |
| --- | --- |
| `DATABASE_URL` | `mysql://USER:PASSWORD@localhost:3306/ems_db` — your MySQL credentials. |
| `SEED_ADMIN_EMAIL` | Email for the admin login the seed creates. |
| `SEED_ADMIN_PASSWORD` | Admin password — **minimum 10 characters**, the seed refuses shorter ones. |
| `AUTH_SECRET` | Session-signing secret. Generate one with `npx auth secret` (or any long random string). |

`.env` is gitignored (the `.env*` pattern with an explicit `!.env.example` exception) — never commit real credentials.

### 3. Create the schema

```bash
npm run db:migrate
```

This is `prisma migrate dev`: it creates the database if needed, applies every migration in `prisma/migrations/`, and regenerates the client. For CI or production use `npx prisma migrate deploy` instead (applies migrations without dev-mode drift checks).

### 4. Seed baseline data

```bash
npm run db:seed
```

Creates (idempotently — safe to re-run):
- the **admin user** from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`
- lookup tables: **institutes**, **degrees**, and **cities** (dropdown options in the internee/tenure forms)

### 5. Run

```bash
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/login`. Sign in with the seeded admin credentials. There is no self-registration; v1 is admin-only, and users exist only via the seed.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server (Turbopack) on :3000 |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run db:migrate` | `prisma migrate dev` — create/apply migrations |
| `npm run db:seed` | Seed admin + lookup data |
| `npm run db:studio` | Prisma Studio (GUI over the database) |

## Database & Prisma

- **Schema:** `prisma/schema.prisma`. Prisma 7 with the `@prisma/adapter-mariadb` driver adapter; config lives in `prisma.config.ts` (schema path, migrations path, seed command).
- **Models:** `User` (auth), `Person` (identity: name, email, phone, gender, city, files), `Internee` (extends Person), `Batch`, `Tenure` (an internee's engagement in a batch — dates, institute, degree, skills, score, certificate), `Institute` / `Degree` / `City` (lookups).
- **Soft deletes:** `Person`, `Internee`, `Batch`, and `Tenure` carry a `deletedAt` timestamp. Nothing is hard-deleted; every query must filter `deletedAt: null`. Deleting an internee cascades soft-deletion to their tenures.
- **Dates:** batch/tenure dates are MySQL `DATE` columns written as UTC midnight (`lib/utils/zod-helpers.ts` → `dateColumn`).
- **Changing the schema:** edit `schema.prisma` → `npm run db:migrate -- --name your-change` → **restart the dev server** (see Troubleshooting) → commit the generated folder under `prisma/migrations/` together with the schema change.

## Assistant chatbot

An admin chatbot (sidebar "Assistant" + floating widget) that answers questions
about batches/internees/tenures by writing **read-only SQL** with an LLM
(OpenAI). Conversations persist in `assistant_conversations` / `assistant_messages`.

Setup after migrating:

1. `OPENAI_API_KEY` in `.env` (optionally `OPENAI_MODEL`, default `gpt-5-mini`).
2. Create the read-only MySQL user: edit the password in
   `scripts/assistant-readonly.sql`, run it as root, and mirror the password in
   `DATABASE_URL_READONLY` in `.env`.

Safety model: the model only ever executes SELECTs through a dedicated MySQL
user that can read the `v_*` views (created by the `assistant_chat` migration;
they pre-filter soft-deleted rows and sensitive columns) — it cannot write or
see base tables even if a bad query slips past the app-side guard
(`src/features/assistant/server/sql-guard.ts`). Every executed query is stored
on the message (`toolCalls`) and viewable in the chat via "View query".

## File uploads

Profile pictures, CVs, and certificates are stored on local disk under `./storage/uploads/` (gitignored, created on demand) via the storage abstraction in `src/lib/storage/`. Uploads are validated by **magic bytes** (jpeg/png/webp/pdf) and size limits, then served only to authenticated users through `GET /api/files/<key>` — never from `/public`.

## Project structure

```
prisma/                  schema, migrations, seed
src/
  app/                   routes: (auth)/login, (app)/{dashboard,batches,internees}, api/
  features/<feature>/    feature modules (batches, internees, tenures, lookups, auth):
    actions.ts             "use server" mutations (Zod-validated, permission-guarded)
    queries.ts             server-only reads
    schemas.ts             Zod schemas (server-authoritative + client RHF variants)
    components/            feature UI
  components/ui/         shadcn/ui primitives (generated)
  components/shared/     app-wide building blocks (PageHeader, table toolkit, chips…)
  lib/                   auth guards, db singleton, storage, utils
  generated/prisma/      Prisma client — generated, do not edit
docs/DESIGN.md           design language distilled from the EMS Figma file
AGENTS.md                rules for coding agents working in this repo
```

## Notes for AI agents

1. **Read `AGENTS.md` first.** The Next.js version here (16.x) has breaking changes vs. most training data — consult `node_modules/next/dist/docs/` for current APIs before writing Next.js code.
2. **Read `docs/DESIGN.md` before touching UI.** It encodes the Figma design language (Lexend, lime/blue color roles, floating sidebar, table/form patterns) *and* the known Figma mistakes that must not be copied.
3. Follow the existing feature-module pattern: server actions validate with Zod and check permissions via `requirePermission`; queries filter `deletedAt: null`; forms use React Hook Form + client Zod schemas while the server schema stays authoritative.
4. Never edit `src/generated/prisma/` or `src/components/ui/` by hand (regenerate via Prisma / shadcn CLI).
5. After running a migration, the dev server must be restarted — a hot reload is not enough.

## Troubleshooting

**`TypeError: Cannot read properties of undefined (reading 'findMany')` on `db.<model>` after a migration**
The running dev server still holds the pre-migration Prisma client (the `db` singleton is cached on `globalThis` across hot reloads). Restart the dev server; if it persists, run `npx prisma generate` first.

**Seed fails with "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set"**
Fill both in `.env`; the password must be ≥ 10 characters.

**`P1001: Can't reach database server`**
MySQL isn't running or `DATABASE_URL` points at the wrong host/port. Verify with `mysql -u USER -p -h localhost`.

**Login always bounces back to `/login`**
`AUTH_SECRET` is missing/changed (old session cookies become invalid — clear cookies) or the seed never ran, so no user exists.

**Windows: `EPERM`/`ENOSPC` during build**
Check free disk space; Next.js builds fail noisily when the drive is nearly full.
