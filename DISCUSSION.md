# Discussion

## Overview

_To be written once all sections are complete._

## Initial Assessment

I started by reading through the whole codebase and running a type check before changing anything. I grouped the issues by impact, so the most serious problems get fixed first and the rest can be scoped to the time available.

### P0 — Security

- `POST /api/seed` deletes every row in the table with no authentication, and it would be reachable in production.
- The search page writes user input into the DOM with `innerHTML`, which is an XSS vector.
- `migrate.js` logs the full `DATABASE_URL`, including the password.

### P0 — Broken

- The project doesn't type-check (20 errors in `page.tsx` and `seed/route.ts`), so `next build` fails and the app can't be deployed.
- `GET /api/destinations` never touches the database. It returns the seed array straight from the source file.
- There are no migration files, and `migrate.js` points at a `drizzle/` folder that doesn't exist, so there is no way to create the schema.
- Searching for almost anything crashes the page: `averageDailyBudget` is a number, and calling `.includes()` on it throws.

### P1 — Incorrect behavior

- Seed data is random (`Math.random` picks activities on every import), so no two environments have the same data. The last activity in the list can never be selected.
- When `DATABASE_URL` is missing, `db/index.ts` returns a fake client that silently returns empty results instead of failing loudly.
- Search is case-sensitive and only matches activities exactly. "Reset" doesn't clear the input.
- The table markup is invalid (`<th>` directly inside `<thead>`), and list items are missing `key` props.
- There are no loading, error, or empty states.

### P2 — Production readiness

- **API:** no server-side filtering, sorting, pagination, input validation, or error handling.
- **Schema:** `cost_level` is free text instead of an enum, `activities` is untyped JSON, and there are no indexes or uniqueness constraints.
- **Tooling:** no formatter, tests, CI, typecheck script, or local database setup. `eslint-config-next` is pinned to a different version than `next`.
- **UI:** inline styles even though Tailwind is installed, no accessible labels, raw unformatted numbers, and no way to filter by region or cost.

### Plan

I'll work through the sections in order, fixing the P0 and P1 items in each one first. P2 items get done where time allows, and anything I skip is listed under _Tradeoffs & Deliberate Omissions_.

## Section 1: Project Setup

### Version control

- **Baseline commit first.** Before changing anything, I committed the original code to `main`. That way every change I make can be reviewed as a diff against what was provided.
- **One branch per section.** Each section gets its own branch (`section-1-project-setup`, `section-2-database-api`, `section-3-user-interface`), which is merged into `main` once it's complete.

### Environment variables

- **Ignored `.env` before the first commit.** The original `.gitignore` only covered `.env*.local`, so `.env` itself would have been committed. Right now it only contains a commented-out placeholder, but this is where the real `DATABASE_URL`, including the database password, will go. I fixed this before the first commit because once a file is in git history, deleting it later doesn't remove it from older commits. This is the only change included in the baseline commit, since it had to be in place before anything was committed.
- **Added `.env.example`.** With `.env` no longer tracked, this file documents which variables the app needs and shows the expected format with safe local defaults. Getting set up locally is just `cp .env.example .env`.

### Local database

- **PostgreSQL runs in Docker Compose.** `docker compose up -d` starts Postgres with the user, password, and database already matching `.env.example`. Anyone can get a working database with one command instead of installing and configuring Postgres by hand.
- **Pinned to `postgres:17-alpine`.** Pinning the major version keeps everyone on the same Postgres version. I chose 17 over 18 because the official 18 image changes how the data directory is laid out, which adds setup complexity for no benefit here.
- **Named volume and healthcheck.** Data survives `docker compose down`. The healthcheck uses `pg_isready` to report when the database is actually ready to accept connections, not just when the container has started. This will also be useful in CI.
- The credentials in `compose.yaml` are local development defaults, not secrets. The database is empty and only reachable from the developer's own machine.

### Node version

- **Pinned Node to 24 (current LTS)** with `.nvmrc` and `engines` in `package.json`. `.nvmrc` lets version managers like `nvm` and CI pick the right version automatically, and `engines` makes npm warn when someone installs with an unsupported version. I set the minimum to 24 because that's the only version I've actually run the project on.

### Formatting

- **Added Prettier with its default settings.** The existing code already followed Prettier's default style, so keeping the defaults meant almost no churn, and anyone who knows Prettier already knows the conventions. Prettier is pinned to an exact version because even minor releases can format code slightly differently.
- **`format` and `format:check` scripts.** Developers run `format` locally. `format:check` only reports problems and exits with an error, which is what CI will run.
- **Formatting has its own commit** (`style: format codebase with Prettier`), separate from tooling and logic changes, so reviewers can safely skip it.
- **Enforced LF line endings with `.gitattributes`.** Git for Windows defaults to `core.autocrlf=true`, which converts files to CRLF on checkout. Prettier expects LF, so `format:check` would fail on Windows for files nobody actually changed. `* text=auto eol=lf` makes every checkout use LF, regardless of the developer's OS or personal git settings.

## Section 2: Database & API

## Section 3: User Interface

## Tradeoffs & Deliberate Omissions

## What I'd Do With More Time
