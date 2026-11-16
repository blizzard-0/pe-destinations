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
npm run migrate:up      # create the database schema
npm run seed            # load sample destinations
npm run dev             # http://localhost:3000
```

### Scripts

| Script                 | Description                               |
| ---------------------- | ----------------------------------------- |
| `npm run dev`          | Start the development server              |
| `npm run build`        | Create a production build                 |
| `npm run lint`         | Run ESLint                                |
| `npm run typecheck`    | Run the TypeScript type checker           |
| `npm run format`       | Format all files with Prettier            |
| `npm run format:check` | Check formatting (used in CI)             |
| `npm test`             | Run the test suite once                   |
| `npm run test:watch`   | Run tests in watch mode                   |
| `npm run generate`     | Generate a migration from schema changes  |
| `npm run migrate:up`   | Apply pending migrations                  |
| `npm run seed`         | Load sample destinations (safe to re-run) |

### API

`GET /api/destinations` returns destinations from the database. All parameters are optional.

| Parameter                | Description                                                      | Default |
| ------------------------ | ---------------------------------------------------------------- | ------- |
| `q`                      | Case-insensitive search in name, country, region, and activities |         |
| `region`                 | Exact region, e.g. `Asia`                                        |         |
| `costLevel`              | `Budget`, `Moderate`, `Premium`, or `Luxury`                     |         |
| `activity`               | Exact activity, e.g. `Cultural Tours`                            |         |
| `minBudget`, `maxBudget` | Average daily budget range in USD (whole numbers)                |         |
| `sort`                   | `name`, `budget`, `visitors`, or `costLevel`                     | `name`  |
| `order`                  | `asc` or `desc`                                                  | `asc`   |
| `page`                   | Page number, starting at 1                                       | `1`     |
| `pageSize`               | Results per page, up to 50                                       | `20`    |

Example: `/api/destinations?region=Asia&sort=budget&order=desc&pageSize=5`

```json
{
  "data": [
    {
      "id": 2,
      "name": "Kyoto",
      "country": "Japan",
      "region": "Asia",
      "costLevel": "Moderate",
      "activities": ["Cultural Tours", "Historical Sightseeing"],
      "averageDailyBudget": 180,
      "annualVisitors": 5300000,
      "createdAt": "2026-11-16T10:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "pageSize": 5, "total": 3, "totalPages": 1 }
}
```

Invalid parameters return `400` with `{ "error": { "message": "...", "issues": [{ "path": "...", "message": "..." }] } }`. Unexpected errors return `500` with a generic message.

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

- **Ignored `.env` before the first commit.** The original `.gitignore` only covered `.env*.local`, so `.env` itself would have been committed. At the time it only contained a commented-out placeholder, but this is where the real `DATABASE_URL`, including the database password, goes. I fixed this before the first commit because once a file is in git history, deleting it later doesn't remove it from older commits. This is the only change included in the baseline commit, since it had to be in place before anything was committed.
- **Added `.env.example`.** With `.env` no longer tracked, this file documents which variables the app needs and shows the expected format with safe local defaults. Getting set up locally is just `cp .env.example .env`.

### Local database

- **PostgreSQL runs in Docker Compose.** `docker compose up -d` starts Postgres with the user, password, and database already matching `.env.example`. Anyone can get a working database with one command instead of installing and configuring Postgres by hand.
- **Pinned to `postgres:17-alpine`.** Pinning the major version keeps everyone on the same Postgres version. I chose 17 over 18 because the official 18 image changes how the data directory is laid out, which adds setup complexity for no benefit here.
- **Named volume and healthcheck.** Data survives `docker compose down`. The healthcheck uses `pg_isready` to report when the database is actually ready to accept connections, not just when the container has started. This will also be useful in CI.
- **The credentials in `compose.yaml` are not secrets.** They're local development defaults for an empty database that's only reachable from the developer's own machine.

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
- **The migration script no longer logs `DATABASE_URL`.** It was printing the full connection string, password included, which ends up in log aggregators in production. The script also couldn't read `.env`, because plain `node` doesn't load it. It now uses Node's built-in `--env-file-if-exists`, which loads `.env` locally and is a no-op in CI and production, where variables come from the environment. No `dotenv` dependency needed.
- **Removed the fake database client.** When `DATABASE_URL` was missing, `db/index.ts` returned a stub that answered every query with an empty array, so the app looked like it simply had no destinations instead of failing. It now throws on startup with a clear message, the same way the Drizzle config and migration script do. This also fixed two type errors, since `db` is no longer a union with the stub.
- **Reused the connection pool across hot reloads.** In development, Next.js re-runs modules on every save, and each run opened a new connection pool without closing the old one, which eventually hits Postgres's connection limit. The pool is now cached on `globalThis` in development.

### Schema

- **`cost_level` is a Postgres enum** (`Budget`, `Moderate`, `Premium`, `Luxury`) instead of free text. The database now rejects typos and unknown values, which would otherwise silently drop out of filters. Enum values also sort in the order they're declared, so sorting by cost goes from cheapest to most expensive instead of alphabetically. Tradeoff: adding a new level requires a migration, which is acceptable since cost tiers rarely change.
- **`activities` is a `text[]` array instead of untyped `jsonb`.** With `jsonb`, the database accepted any JSON value and TypeScript saw the column as `unknown`. A native array is type-checked by both, and "destinations offering X" is a simple containment query that can be indexed. I considered a separate `activities` table with a join table, which would keep activity names consistent, but it adds two tables and a join to every query, which is more than this dataset needs.
- **`created_at` is now `timestamptz` and `NOT NULL`.** A plain `timestamp` stores wall-clock time with no time zone, so values become ambiguous as soon as the app and database run in different zones. `timestamptz` stores an exact moment, which is what Postgres itself recommends. The column was also nullable despite having a default, so TypeScript typed it as `Date | null`. I didn't add `updated_at` because nothing in the app updates rows yet.
- **Unique constraint on `(name, country)`.** Nothing stopped the same destination from being inserted twice. Uniqueness is on the pair rather than the name alone, because different countries can have places with the same name (for example, Córdoba in Spain and in Argentina). It also lets the seed upsert instead of wiping the table first.
- **No check constraints.** I wanted the database to reject negative budgets and visitor counts, but the installed `drizzle-kit` (0.23) doesn't generate check constraints, so they would be silently left out of migrations. I validate these values in application code instead and list upgrading Drizzle under future work.
- **Migrations are generated from the schema and committed** (`drizzle/`), including Drizzle's snapshot files, which it uses to work out what changed next time. Previously there were no migrations at all, so there was no way to create the table. I deliberately left indexes out of the initial migration. They should match the queries the API actually runs, so I add them in a separate migration once the API is designed.

### Seed data

- **Seed data is deterministic.** Activities used to be picked with `Math.random` every time the module loaded, so every environment had different data, tests couldn't rely on it, and destinations got nonsensical activities (the off-by-one also meant the last activity could never be picked). Each destination now has a fixed, realistic list drawn from the same set of activity names.
- **Seed data is typed as `NewDestination[]`**, a type inferred from the Drizzle schema. A typo in `costLevel` is now a compile error rather than a database error. Exporting `Destination` and `NewDestination` from the schema also gives the API and UI a single source of truth for the data shape.
- **Replaced `POST /api/seed` with an `npm run seed` script.** The endpoint deleted every row without authentication and would have been reachable in production. Seeding is a developer task, so it now runs from the command line, like migrations. The script upserts on `(name, country)`, so it's safe to run any number of times and updates existing rows instead of wiping the table. It doesn't remove destinations that were deleted from the seed file, which is fine for development data.
- **TypeScript scripts run through `tsx`**, loaded with `node --import tsx`. Node itself still handles `--env-file-if-exists`, the same way as in the migration script.

### API

- **Query parameters are validated with Zod** before anything touches the database. Invalid input (`page=abc`, `costLevel=Cheap`, `pageSize=1000`, a `minBudget` above `maxBudget`) gets a `400` with a clear message instead of being silently ignored. Empty parameters such as `?region=` are treated as not sent, since that's what a cleared filter in the UI produces. `pageSize` is capped at 50 so a single request can't ask for the whole table.
- **Allowed `costLevel` values come from the Drizzle enum**, so the database, the types, and the validation can't drift apart.
- **Validation lives in its own module (`params.ts`) with unit tests.** These are the project's first tests, so `--passWithNoTests` is gone.
- **Filtering and sorting happen in the database, not the browser.** The original page downloaded every destination and filtered in JavaScript, which doesn't scale. `q` is a case-insensitive search across name, country, region, and activities. The other filters are exact matches, combined with AND.
- **Search input is escaped for `LIKE`.** `%` and `_` are wildcards in `ILIKE`, so searching for `%` would have matched everything. This isn't SQL injection (Drizzle sends values as parameters), but it's a correctness bug that's easy to miss.
- **Sorting uses an allow-list of columns and always breaks ties by `id`**, so users can only sort by fields the API exposes, and paging through results never shows the same destination twice or skips one.
- **The endpoint now reads from the database and returns `{ data, pagination }`.** The original route returned the hard-coded seed array, not the database. `pagination` includes `total` and `totalPages`, so the UI can render page controls without another request. The page of results and the total count run as two parallel queries with the same filters.
- **Errors have a consistent shape.** Invalid parameters return `400` with a list of issues, so the client can show what's wrong. Unexpected failures return a generic `500`, and the details go to the server log instead of the response, because database errors can expose internal details.
- **A page past the end returns `200` with an empty list, not `404`.** The request is valid; there are just no results on that page, the same as a filter that matches nothing.
- **The route is explicitly `force-dynamic`.** In Next.js 14, a `GET` handler that doesn't read the request is cached at build time, so the original route would have served the same response forever. Reading the query string already opts out, but the explicit setting documents the intent and protects against that regression.

### Indexes

- **Indexes match the filters the API runs**, added in a second migration. `region` and `average_daily_budget` get B-tree indexes for the equality and range filters, and `activities` gets a GIN index, which is what Postgres needs for array containment (`@>`). Sorting by name already uses the index behind the `(name, country)` unique constraint.
- **No index on `cost_level`.** It has only four values, so each one matches about a quarter of the table and Postgres would scan the table anyway. The index would only slow down writes.
- **Free-text search (`q`) isn't indexed.** A `%term%` pattern can't use a B-tree index. At this size a sequential scan is fine; at scale I'd add a trigram index (`pg_trgm`) or use Postgres full-text search.
- **With 15 rows, Postgres ignores these indexes and scans the table**, because that's cheaper. I checked with `EXPLAIN`, with sequential scans disabled, that the planner can use them, so they'll take effect as the data grows. On a large production table I'd use `CREATE INDEX CONCURRENTLY` to avoid blocking writes. Drizzle's migrator can't do that, because it runs migrations inside a transaction.

## Section 3: User Interface

### Bug fixes

- **Typed the page with the API's response types.** `useState([])` was inferred as `never[]`, which caused most of the type errors and hid the real ones. With the state typed, TypeScript pointed straight at the actual bugs below. The page imports the types with `import type`, so no server code ends up in the browser bundle.
- **Removed an XSS vulnerability.** The search term was written into the page with `innerHTML`, so typing `<img src=x onerror=alert(1)>` ran JavaScript. It's now rendered as React text, which is escaped automatically. This matters even more once the search term lives in the URL, where it could be sent to someone else as a link.
- **Fixed search breaking on most terms.** The filter called `.includes()` on `averageDailyBudget`, which is a number, so any term that didn't match a text field threw a `TypeError` and the results stopped updating. Matching a budget as text doesn't make sense anyway, so I removed it.
- **Reset now clears the input**, not just the results. The input was uncontrolled, so the old term stayed in the box. It's now a controlled input driven by React state.
- **Fixed invalid table markup and missing `key` props.** Header cells weren't wrapped in a `<tr>`, which is invalid HTML and causes hydration warnings. I also removed leftover `console.log` calls. With these fixes, the project passes type checking and linting for the first time, so CI is green.

### Search

- **Search runs on the server through the API** instead of filtering a full copy of the data in the browser. It's now case-insensitive and matches partial activity names (`surf` finds "Surfing"), and the browser only downloads the results it shows. There's also a single search implementation, so the page and the API can't disagree.
- **Requests are debounced by 300 ms**, so typing "barcelona" sends one request instead of nine. The initial load and Reset aren't delayed.
- **Outdated requests are cancelled with `AbortController`.** Without this, a slow response for an earlier term could arrive after a newer one and replace the results with the wrong list.

### Loading, error, and empty states

- **The page now tells users what's happening.** Before, a slow request, a failed request, and a search with no results all looked the same: an empty table. A failed request also left an unhandled promise rejection.
- **Previous results stay on screen while a new search loads**, so the table doesn't flash empty on every search.
- **Errors show a friendly message with a "Try again" button.** The technical details go to the console; in production I'd send them to an error tracker such as Sentry.
- **Status messages use `role="status"` and `role="alert"`**, so screen readers announce them when they appear.

### Structure

- **Split the page into components and hooks.** `page.tsx` is now a server component, and only the interactive part (`DestinationSearch`) is a client component, so less JavaScript ships to the browser. The table is a presentational component that only renders the rows it's given.
- **Data fetching lives in a `useDestinations` hook** that takes a query string and handles cancellation, status, and retries. Debouncing is a separate, reusable `useDebouncedValue` hook. Each piece has one job, and adding filters only means building a different query string.

### URL state

- **The current query lives in the URL** (`/?q=bali`), so results survive a refresh and can be bookmarked or shared. The page reads the initial query from `searchParams` on the server and passes it to the client component, so the search box is already filled in the first HTML.
- **The URL is updated with `history.replaceState`**, which Next.js 14.2 keeps in sync with its router without a server round trip. I used replace rather than push, so typing doesn't add a history entry for every search. The tradeoff is that the Back button leaves the page instead of undoing the last change.
- **Debouncing moved from the value to the update.** Once the search had to update shared query state, debouncing the update inside the input handler was simpler than copying a debounced value into the query with an effect, which also caused a race with Reset. I removed the `useDebouncedValue` hook.

### Filters

- **Added region and cost level filters**, combined with the search using AND and stored in the URL like the search. The options come from the source of truth: regions are loaded from the database in the server component, and cost levels come from the Drizzle enum, so a new region or level shows up without a code change.
- **If loading regions fails, the page still renders** without region options, and the results area shows its own error with a retry button. A secondary dropdown shouldn't take down the whole page.
- **The filter bar is an accessible form.** Every control has a visible label, the form is a `search` landmark, and pressing Enter doesn't reload the page. The loading message is an always-present live region with a fixed height, so screen readers announce it reliably and the table doesn't jump.
- **New UI is styled with Tailwind**, which was already installed but unused, instead of inline styles.

### Sorting and pagination

- **Sorting is a single dropdown** with options like "Daily budget (high to low)" instead of separate field and direction controls. It's easier to scan and maps directly onto the API's `sort` and `order` parameters. Sorting by cost level follows the enum order, from Budget to Luxury.
- **Pagination uses Previous and Next buttons with "Showing 1–20 of 45"**, based on the `total` and `totalPages` the API returns. Changing the search, a filter, or the sort goes back to page 1. Default values (page 1, name A–Z) are left out of the URL to keep it short.
- **A page past the end of the results**, such as an old link after the data changed, shows a link back to the first page instead of claiming that nothing matches.

## Tradeoffs & Deliberate Omissions

- **Only the database runs in Docker, not the app.** Running the Next.js dev server in a container on Windows or macOS makes hot reload slow or unreliable, requires workarounds for platform-specific binaries in `node_modules`, and editor tooling still needs a local `node_modules` anyway. Containerizing dependencies while running the app natively is the common setup and keeps the development loop fast.

## What I'd Do With More Time

- **Upgrade to Next.js 15+ and React 19.** I kept the project on Next 14 because a major upgrade brings breaking changes (async request APIs, different caching defaults) that are too risky for the time available. I only applied the patch-level update.
- **Upgrade Drizzle** to a version whose migration generator supports check constraints, and move numeric validation (non-negative budget and visitor counts) into the database.
- **Upgrade to ESLint 9.** ESLint 8 is no longer supported, but moving to ESLint 9 means rewriting the config in the new flat config format.
- **Add a production `Dockerfile`** using Next.js standalone output and a multi-stage build, to produce a small image for deployment.
- **Add integration tests for the API against a real Postgres database**, run in CI with a Postgres service container. The unit tests check the SQL conditions and parameters the API generates, and I tested the endpoint manually, but only a real database proves the queries return the right rows.
- **Publish an OpenAPI spec for the API**, viewable with Swagger UI or a similar tool. I'd generate it from the Zod schema that already validates the parameters, so the documentation can't drift from the actual behavior the way the hand-written table in this document can.
