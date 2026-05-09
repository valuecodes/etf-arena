# Phase 4 — D1 Schema, Polygon Client, Real Seeded Data

## Goal

Replace the canned JSON in the api worker with real D1 reads. Schema lives
in D1, the Polygon client fetches prices, the api worker reads from D1, and
the web app shows real seeded teams.

See [../architecture.md](../architecture.md) for the full schema, the
`ReadOnlyRepo` / `WriteRepo` split, and the KV cache key conventions.

## Deliverables

- `packages/db`:
  - Drizzle schema for every table listed in `architecture.md` —
    `teams`, `agents`, `runs`, `team_runs`, `decisions`,
    `portfolio_snapshots`, `trades`, `holdings`, `macro_briefs`,
    `research_calls`, `citations` — including all UNIQUE / PRIMARY KEY
    idempotency constraints.
  - D1 migration files plus `migrate:local` and `migrate:remote` scripts
    using `wrangler d1`.
  - `ReadOnlyRepo` (selects only) and `WriteRepo` exposed from separate
    entry points so the api worker can only import the read-only one.
- `packages/market-data`: typed Polygon client with Zod-validated
  responses and KV-backed caching:
  - `getDailyAggregates(ticker, dateRange)`
  - `getTickerDetails(ticker)`
  - `getMarketStatus()` (used in phase 5 for the trading-day guard)
- `packages/db/scripts/seed.ts`: idempotent seed that creates 2-3 demo
  teams. Each team row sets `starting_cash` (e.g. $100,000) and
  `started_at` (today's run-date) — these are durable initial balances
  used by later phases to reconstruct cash deterministically. No
  `holdings` rows and no `trades` rows yet.
- `apps/api`:
  - Switch handlers from hard-coded JSON to real D1 reads via
    `ReadOnlyRepo`.
  - Add a KV response cache layer with structured keys (`teams:*`,
    `team:{slug}:*`, `decisions:{date}:*`, `macro-brief:{date}`).
  - New endpoints (return empty / `null` for now since no decisions
    exist yet):
    - `GET /teams/:slug/decisions`
    - `GET /teams/:slug/decisions/:id`
- `apps/web`: add the team detail page; render real seeded teams from the
  api worker (cash, persona, empty holdings list).

## Out of scope

- Decisions, macro briefs, raw transcripts (phase 5+).
- Workflows / cron / Perplexity / OpenAI (phase 5+).
- The `WorkerEntrypoint.invalidateAfterRun` RPC (phase 5, when invalidation
  has something to do).

## Verification

- `pnpm --filter @repo/db migrate:local` builds the schema in local D1;
  `wrangler d1 execute etf-arena --local --command "select name from sqlite_master"`
  lists the expected tables.
- Vitest:
  - `ReadOnlyRepo` type surface forbids writes (compile-time test).
  - Runtime test confirms attempted writes via the read-only path throw.
  - Idempotency: running the seed script twice produces identical row
    counts.
- Live Polygon test (env-gated, opt-in via `POLYGON_API_KEY`): fetches a
  known ETF's last EOD bar and validates the Zod schema.
- Preview deploy: production web URL shows real seeded teams and empty
  decision lists.
- Root `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test` all
  pass.
