# Phase 3 — Cron-only Agents Worker, Deployed; agents → api Service Binding

## Goal

Deploy `apps/agents` to Cloudflare with no public HTTP surface and wire a
Service Binding so the agents worker can RPC into `apps/api` to invalidate
its KV cache. Proves the agents deploy pipeline, the `nodejs_compat`
flag, and Service Binding configuration — all without any real workflow
logic.

The agents worker is **cron-only** in this phase: the only entry point is
the daily `scheduled` handler. The api → agents direction (and any
operator-triggered admin route on `apps/api`) is not part of this phase
and is left open as a later question — see _Out of scope_.

See [../architecture.md](../architecture.md) for the long-term worker
boundary and service-binding rules; the architecture doc still describes
both directions and the `/admin/run` route as the eventual end-state.

## Deliverables

- `apps/agents/`: Worker with `compatibility_flags = ["nodejs_compat"]`,
  `workers_dev = false`, and **no `routes`** entry.
  - Default export: a plain `ExportedHandler<Env>` (not a
    `WorkerEntrypoint`, since there is no inbound RPC). Exposes only
    `scheduled`. No `fetch` — a worker with no public surface should
    have no public surface.
  - The `scheduled` handler is a stub that derives `runDate` from
    `controller.scheduledTime` (UTC for now; phase 5 switches to
    America/New_York) and calls `env.API.invalidateAfterRun(runDate)`.
    This exercises the agents → api binding end-to-end on every cron
    firing.
  - **Service Binding to `etf-arena-api`** (caller-side, agents → api)
    used to call `api.invalidateAfterRun(runDate)`.
  - **Cron schedule enabled** (`triggers.crons: ["5 22 * * 1-5"]`,
    matching the architecture doc's post-US-equity-close cadence) so
    the binding is verified in production automatically without any
    manual trigger.
- `apps/agents/wrangler.jsonc`: production deploy target
  `etf-arena-agents`. No public route.
- `apps/api`:
  - Default export becomes a `WorkerEntrypoint` that delegates `fetch`
    into the existing Hono `app` (refactored into a separate
    `apps/api/src/app.ts` module) and additionally exposes
    `invalidateAfterRun(runDate)` as an RPC method. The stub just logs
    and returns `{ status: "stub" }`; phase 5 wires it to KV cache key
    purges.
  - **No api → agents Service Binding** in this phase.
  - **No `/admin/run` admin endpoint** in this phase (no caller, no
    bypass-token, no Cloudflare Access policy).
- `packages/types`: new `@repo/types/rpc` export carrying the `ApiRpc`
  contract. Both apps consume it — the api entrypoint `implements
ApiRpc`, and the agents `Env` types its binding as `ApiRpc`.
- CI: append a `deploy-agents` job to `.github/workflows/main.yml`
  mirroring `deploy-api`. Both deploy in parallel after the standard
  typecheck / lint / format-check / test gates; Service Bindings
  resolve at request time, not deploy time.

## Out of scope

- `@openai/agents` SDK and its `nodejs_compat` smoke test — deferred to
  phase 5 along with the real workflow code. The `nodejs_compat` flag
  is on now so phase 5 doesn't have to touch wrangler config.
- The api → agents Service Binding, the `triggerRun` / `runStatus` RPC
  methods on the agents worker, the `POST /admin/run` admin route on
  the api worker, and the Cloudflare Access policy that would protect
  it. The architecture doc still references this control path; whether
  it ever lands depends on whether cron remains the only trigger in
  practice.
- Real Workflow, real reasoning, real trades, Polygon / Perplexity /
  OpenAI calls (phase 5+).
- D1 / R2 / KV bindings on the agents worker (phase 5).

## Verification

- Local: `pnpm --filter api dev` (port 3001) and
  `pnpm --filter agents dev` (port 3002, with `--inspector-port 9230`
  to avoid colliding with the api wrangler's default 9229 inspector
  and the astro dev's auto-fallback). Manually fire the agents
  scheduled handler:
  `curl 'http://localhost:3002/__scheduled?cron=*+*+*+*+*'`. Expected
  log lines, in order: `apps/agents` → `scheduled fired (stub)`,
  `apps/api` → `invalidateAfterRun (stub)`, `apps/agents` →
  `invalidateAfterRun returned`. This proves the **agents → api**
  Service Binding works.
- Production: both workers deploy via the existing CI workflow.
  - Verify agents has no `routes` and `workers_dev = false` (Cloudflare
    dashboard → `etf-arena-agents` → Triggers; `curl
https://etf-arena-agents.<account>.workers.dev/` should fail at DNS
    or return an inactive-worker response).
  - Verify the agents → api binding: wait for the next weekday
    22:05 UTC firing, or click the "Send" button on the cron trigger
    in the dashboard. Expect the same three log lines as in local dev.
- Root `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test`
  all pass.

## Notes

- The cron `scheduled` handler is enabled in production from day one
  but its body is a no-op (logs + a stub `invalidateAfterRun` that
  also just logs). No paid-API calls, no DB writes, no R2 writes — safe
  to leave running. Phase 5 replaces the body with the real Workflow
  dispatch.
- `run_date` derivation in the stub is intentionally UTC-based and will
  drift one day ahead of the New York calendar date late in the day.
  Phase 5 switches it to America/New_York semantics along with the rest
  of the workflow logic.
