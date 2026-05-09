# Phase 3 — Placeholder Agents Worker, Deployed; Service Binding Wired

## Goal

Deploy `apps/agents` to Cloudflare with no public HTTP surface, and wire a
Service Binding so `apps/api` can RPC into it. Proves the agents deploy
pipeline, the `nodejs_compat` flag, Service Binding configuration, and
Cloudflare Access on the api admin route — all without any real workflow
logic.

See [../architecture.md](../architecture.md) for the worker boundary and
service-binding rules.

## Deliverables

- `apps/agents/`: Worker with `compatibility_flags = ["nodejs_compat"]`,
  `workers_dev = false`, and **no `routes`** entry.
  - Exports a `WorkerEntrypoint` with RPC methods:
    - `triggerRun(date)` → `{ status: "stub", date }`
    - `runStatus(date)` → `{ status: "stub" }`
  - Empty `scheduled` handler (cron not enabled yet).
  - **Service Binding to `etf-arena-api`**, used in later phases to call
    `api.invalidateAfterRun(runDate)`. In this phase, an internal stub
    function exercises the binding (`api.healthz()`-style call) so the
    direction is validated end-to-end on deploy.
- `apps/agents/wrangler.jsonc`: production deploy target
  `etf-arena-agents`. No public route.
- `apps/api`:
  - **Service Binding to `etf-arena-agents`** (separate, caller-side
    binding from the agents → api one above).
  - New admin endpoint `POST /admin/run?date=YYYY-MM-DD` calls
    `agents.triggerRun(date)` and returns the stub response.
  - Adds a `WorkerEntrypoint` exporting `invalidateAfterRun(runDate)` —
    in this phase it just logs and returns `{ status: "stub" }`; phase
    5 wires it to KV cache invalidation.
  - In production, the admin route is protected by a Cloudflare Access
    application policy. In dev, a header-based bypass token is accepted.
- A small `apps/agents` Vitest case imports `@openai/agents` (without
  calling OpenAI) to confirm the SDK loads under `nodejs_compat` —
  catches Cloudflare/SDK incompatibilities now, not later. Run via
  `@cloudflare/vitest-pool-workers`.
- CI: add `deploy-agents.yml` (manual `workflow_dispatch` and/or
  push-to-main).

## Out of scope

- Workflows, cron, Polygon, Perplexity, OpenAI calls (phase 5+).
- D1 / R2 / KV bindings on the agents worker (phase 5).
- Real reasoning, real trades (phase 6).

## Verification

- `pnpm --filter agents dev` + `pnpm --filter api dev`: locally,
  `curl -X POST localhost:8788/admin/run?date=2026-05-09` (with the dev
  bypass header) returns the stub response, proving the **api → agents**
  Service Binding works.
- The agents worker's stub Workflow path also calls
  `api.invalidateAfterRun("2026-05-09")` and asserts a non-error
  response, proving the **agents → api** Service Binding works (each
  direction is a separate caller-side binding).
- Production: agents worker has no `routes` and `workers_dev = false`
  (verify via `wrangler deployments list` or the Cloudflare dashboard);
  the production api worker's `/admin/run` (behind Access) returns the
  stub response.
- `@openai/agents` import smoke test passes in CI.
- Root `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test`
  all pass.
