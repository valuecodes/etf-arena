# Phase 7 — Production Cutover

## Goal

Take the system to autonomous, monitored production operation. After this
phase, a fresh trading day completes end-to-end on its own, with logs and a
runbook for when something does go wrong.

See [../architecture.md](../architecture.md) for the cron schedule, privacy
boundary, and worker boundary that this phase locks down for production.

## Deliverables

- Production secrets configured for the agents worker via
  `wrangler secret put`: `OPENAI_API_KEY`, `POLYGON_API_KEY`,
  `PERPLEXITY_API_KEY`. None of these live on the api or web workers.
- Cron Trigger enabled in production for `apps/agents` at
  `5 22 * * 1-5`. Preview cron may stay enabled for testing.
- Cloudflare Access application policy on `apps/api`'s `/admin/*` routes.
  Confirm the policy via a fresh browser session — anonymous access must
  be denied.
- `apps/api` rate limits on public endpoints (e.g. via Cloudflare Rate
  Limiting Rules or a small per-IP token bucket in KV). CORS allows only
  the production web origin.
- Workers Logs / Logpush (or Tail Workers) capturing structured logs from
  both workers. Add a lightweight health check — either a small cron
  worker or an external monitor — that alerts when:
  - `runs.status='failed'` for the latest trading day, or
  - the latest `runs.run_date` is older than the most recent expected
    trading day.
- Runbook: extend `architecture.md` with a "Runbook" section (or add
  `docs/runbook.md`) covering:
  - How to manually re-run a date via `POST /admin/run`.
  - How to inspect a raw transcript in R2 (`wrangler r2 object get`).
  - How to roll back a bad run (truncate the day's `decisions`,
    `trades`, `portfolio_snapshots`, then re-run).
  - How to retire a team (mark inactive vs hard delete).

## Out of scope

- Net-new product features. Phase 7 is hardening only.

## Verification

- One full unattended trading day: cron fires at `22:05 UTC`, the
  Workflow succeeds, the public site reflects the new run within
  ~2 minutes (after the api KV cache + Astro `s-maxage` settle), and no
  manual intervention is required.
- Failure-injection test in preview: kill the Polygon API mid-run (e.g.
  rotate the key); confirm Workflow retries succeed once the key is
  restored and the final D1 state is consistent (no duplicate trades, no
  orphan decisions).
- Access verification: `curl -X POST <api>/admin/run` from an anonymous
  session is rejected by Cloudflare Access; an authorized session
  succeeds.
- Health check fires an alert when a synthetic `runs.status='failed'`
  row is inserted, and clears once removed.
