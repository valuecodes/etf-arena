# Phase 5 — Cron + Workflow: Snapshots and Macro Brief

## Goal

The agents worker runs a daily Workflow on cron that opens a run, checks the
trading calendar, fetches prices, generates a macro brief, and writes
mark-to-market snapshots. Reasoning and trades are still stubbed. The
public site shows the new snapshots and macro briefs.

See [../architecture.md](../architecture.md) for the full Workflow shape,
cron rules, and idempotency contract.

## Deliverables

- `packages/research`: Perplexity Sonar Deep Research client.
  - `deepResearch(query)` returns `{ summary, body, citations[] }` against
    `sonar-deep-research`.
  - KV cache keyed by hashed query + run-date so retries are free.
  - Zod-validated response shape.
- `apps/agents` Workflow steps implemented (stubs remain for the rest):
  - `openRun` — derive `run_date` from the cron fire time as the
    just-closed US market date (`America/New_York`). `INSERT … ON
    CONFLICT DO UPDATE` on `runs(run_date)`. Calendar guard via Polygon
    market-status: weekend/holiday → `status='skipped'` and exit;
    finalized-bar guard checks **`run_date` itself** (not the prior
    day) — if not yet final, `status='pending_close'` and exit so a
    follow-up retry can finish the run.
  - `fetchPrices` — Polygon EOD aggregates for `run_date` (KV-cached).
  - `fetchMacroBrief` — one Perplexity call per run-date. Raw body to R2
    at `macro/{run_date}.json`; `summary_public` + citations to D1.
  - `markToMarket` — upsert `portfolio_snapshots` with cash recomputed
    as `teams.starting_cash + Σ(trade cashflows up to run_date)` and
    NAV as `cash + Σ(qty × close_price)`.
  - `closeRun + purgeApiCache` — flip `runs.status` to `succeeded`,
    then call `api.invalidateAfterRun(runDate)` over the **agents → api
    Service Binding** (a separate caller-side binding from the api →
    agents one used to start the run).
  - `runTeam` / `publishDecision` / `executeTrades` remain **stubbed**:
    write a placeholder `decisions` row marked as a stub so the existing
    api endpoints have something to return.
- Cron Trigger at `5 22 * * 1-5` enabled on the **preview** environment
  only. Production cron stays off until phase 7.
- `apps/api`:
  - `GET /macro-briefs/:date` serves real data.
  - `WorkerEntrypoint.invalidateAfterRun(runDate)` RPC method that
    deletes the affected KV keys.
- `apps/web`:
  - Macro-brief panel on the leaderboard page.
  - Team detail page shows the snapshot history chart (uplot island).

## Out of scope

- Real OpenAI Agents SDK reasoning (phase 6).
- Public sanitized decision pages with audit log (phase 6).
- Production cron (phase 7).

## Verification

- Idempotency test: invoke the Workflow twice for the same `run_date`
  locally; assert exactly one `runs` row, one `macro_briefs` row, and one
  `portfolio_snapshots` per team. Holdings unchanged.
- Calendar guard test: stub Polygon market-status to "closed"; assert
  the workflow inserts `runs.status='skipped'` and makes zero LLM /
  Perplexity calls.
- Preview-env end-to-end: trigger via `POST /admin/run`, then open the
  public site and confirm the new macro brief and snapshots appear after
  the api KV cache is purged.
- Root `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test`
  all pass.
