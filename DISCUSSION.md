# Discussion

## Overview

_To be written once all sections are complete._

## Running Locally

The README is the original assignment brief, so I've left it untouched and documented the setup here instead.

### Prerequisites

- Node.js 24 (see `.nvmrc`)
- Docker (runs the local PostgreSQL database)

### Setup

```bash
cp .env.example .env    # Windows cmd: copy .env.example .env
docker compose up -d    # start PostgreSQL
npm ci                  # install exact dependency versions
npm run dev             # http://localhost:3000
```

### Scripts

| Script                 | Description                     |
| ---------------------- | ------------------------------- |
| `npm run dev`          | Start the development server    |
| `npm run build`        | Create a production build       |
| `npm run lint`         | Run ESLint                      |
| `npm run typecheck`    | Run the TypeScript type checker |
| `npm run format`       | Format all files with Prettier  |
| `npm run format:check` | Check formatting (used in CI)   |
| `npm test`             | Run the test suite once         |
| `npm run test:watch`   | Run tests in watch mode         |

## Initial Assessment

I started by reading through the whole codebase and running a type check before changing anything. I grouped the issues by impact, so the most serious problems get fixed first and the rest can be scoped to the time available.

### P0 — Security

- `POST /api/seed` deletes every row in the table with no authentication, and it would be reachable in production.
- The search page writes user input into the DOM with `innerHTML`, which is an XSS vector.
- `migrate.js` logs the full `DATABASE_URL`, including the password.

### P0 — Broken

- The project doesn't type-check (18 errors in `page.tsx` and `seed/route.ts`), so `next build` fails and the app can't be deployed.
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
- **Updated `@types/node` from 20 to 24** so the type definitions match the Node version the project actually runs on. I found the mismatch when installing Vitest, which requires newer Node types. I resolved it by aligning the versions instead of forcing the install with `--legacy-peer-deps`, which would have hidden the problem.

### Formatting

- **Added Prettier with its default settings.** The existing code already followed Prettier's default style, so keeping the defaults meant almost no churn, and anyone who knows Prettier already knows the conventions. Prettier is pinned to an exact version because even minor releases can format code slightly differently.
- **`format` and `format:check` scripts.** Developers run `format` locally. `format:check` only reports problems and exits with an error, which is what CI will run.
- **Formatting has its own commit** (`style: format codebase with Prettier`), separate from tooling and logic changes, so reviewers can safely skip it.
- **Enforced LF line endings with `.gitattributes`.** Git for Windows defaults to `core.autocrlf=true`, which converts files to CRLF on checkout. Prettier expects LF, so `format:check` would fail on Windows for files nobody actually changed. `* text=auto eol=lf` makes every checkout use LF, regardless of the developer's OS or personal git settings.

### Linting

- **Aligned `eslint-config-next` with `next`.** The config was pinned to 14.2.5 while `next` had resolved to 14.2.35. The two are released together, so their versions should match.
- **Added `eslint-config-prettier`** so that ESLint handles code quality and Prettier handles formatting, without the two fighting over style rules. I didn't use `eslint-plugin-prettier`, since the Prettier team recommends against running Prettier as a lint rule.
- **Added a `typecheck` script** (`tsc --noEmit`). `next dev` doesn't type-check, which is how the project ended up with 18 type errors that nobody noticed. `next build` does catch them, but it's slow because it also builds the app. A dedicated script gives a fast check to run locally and in CI. It currently fails on purpose: the errors are in the API and UI code, and I fix them in Sections 2 and 3.

### Testing

- **Set up Vitest.** It runs TypeScript and ES modules without extra configuration, uses the same API as Jest, and is supported in the Next.js docs. The config maps the `@/` path alias so tests can import code the same way the app does.
- **Infrastructure first, real tests later.** There's no code worth testing yet. I'll add tests next to the code that needs them in Sections 2 and 3 (API parameter validation and search logic) instead of writing placeholder tests now. `--passWithNoTests` is temporary and will be removed once the first test exists.

### Continuous integration

- **GitHub Actions runs format check, lint, typecheck, and tests** on every pull request and on every push to `main`, so these checks don't depend on anyone remembering to run them.
- **Node version comes from `.nvmrc`**, so it's defined in one place. CI uses `npm ci` to install exactly what's in the lockfile.
- **CI is expected to fail until Sections 2 and 3 are done.** Lint and typecheck report real bugs in the existing API and UI code, which I fix in those sections. I left them failing rather than disabling the checks.
- **No `next build` step yet.** Typecheck already catches the same errors faster. I'll revisit this in Section 2, once the API reads from the database and it's clear whether the build needs a database connection.

## Section 2: Database & API

### Database tooling

- **Typed the Drizzle config with `defineConfig`**, so typos in config keys are caught by TypeScript instead of failing silently. I also set the migrations folder (`out`) explicitly, since `migrate.js` depends on it.
- **The config fails fast when `DATABASE_URL` is missing**, with an error message that says how to fix it, rather than passing `undefined` along and failing later with a confusing error.

### Schema

- **`cost_level` is a Postgres enum** (`Budget`, `Moderate`, `Premium`, `Luxury`) instead of free text. The database now rejects typos and unknown values, which would otherwise silently drop out of filters. Enum values also sort in the order they're declared, so sorting by cost goes from cheapest to most expensive instead of alphabetically. Tradeoff: adding a new level requires a migration, which is acceptable since cost tiers rarely change.

- **`activities` is a `text[]` array instead of untyped `jsonb`.** With `jsonb`, the database accepted any JSON value and TypeScript saw the column as `unknown`. A native array is type-checked by both, and "destinations offering X" is a simple containment query that can be indexed. I considered a separate `activities` table with a join table, which would keep activity names consistent, but it adds two tables and a join to every query, which is more than this dataset needs.

- **`created_at` is now `timestamptz` and `NOT NULL`.** A plain `timestamp` stores wall-clock time with no time zone, so values become ambiguous as soon as the app and database run in different zones. `timestamptz` stores an exact moment, which is what Postgres itself recommends. The column was also nullable despite having a default, so TypeScript typed it as `Date | null`. I didn't add `updated_at` because nothing in the app updates rows yet.

## Section 3: User Interface

## Tradeoffs & Deliberate Omissions

- **Only the database runs in Docker, not the app.** Running the Next.js dev server in a container on Windows or macOS makes hot reload slow or unreliable, requires workarounds for platform-specific binaries in `node_modules`, and editor tooling still needs a local `node_modules` anyway. Containerizing dependencies while running the app natively is the common setup and keeps the development loop fast.

## What I'd Do With More Time

- **Add a production `Dockerfile`** using Next.js standalone output and a multi-stage build, to produce a small image for deployment.

- **Upgrade to Next.js 15+ and React 19.** I kept the project on Next 14 because a major upgrade brings breaking changes (async request APIs, different caching defaults) that are too risky for the time available. I only applied the patch-level update.
- **Upgrade to ESLint 9.** ESLint 8 is no longer supported, but moving to ESLint 9 means rewriting the config in the new flat config format.
