# Phase 6 — Real Agents and Public Reasoning

## Goal

Full daily run with real OpenAI Agents SDK reasoning, sanitized public
output, and applied paper trades. This is the headline feature — after this
phase the public site shows real, evolving portfolios with reasoning the
agents actually produced.

See [../architecture.md](../architecture.md) for the privacy boundary and
the `publishDecision` sanitization contract.

## Deliverables

- `packages/agents-core`:
  - Per-role agent definitions (analyst, risk, PM) built from
    `teams` / `agents` D1 rows.
  - Tools exposed to the agents:
    - `getPrices(tickers)` — reads from the KV-cached Polygon snapshot.
    - `getHoldings()` — reads the team's current holdings from D1.
    - `researchSector(sector)` — Perplexity-backed, **rate-limited at 2
      calls per team per day**, enforced inside the tool.
    - `proposeTrade(ticker, side, qty)` — appends a structured proposal;
      no DB write here, the workflow's `executeTrades` step persists.
  - The shared macro brief is **pre-injected** into the analyst's
    context, never re-fetched per call.
- `apps/agents` Workflow steps implemented:
  - `runTeam` (per team) — execute the agents pipeline. Persist the
    **raw** transcript to R2 at `transcripts/{run_date}/{team_id}.json`.
  - `publishDecision` (per team) — sanitization pass with three sub-steps,
    then upsert the `decisions` row with `UNIQUE(team_id, run_date)`:
    1. constrained LLM call producing a `summary_public` from the raw
       transcript;
    2. pattern-based redactor for API keys, internal URLs, and PII
       heuristics;
    3. deterministic tool-call audit log (tool name, arguments,
       result-hash, latency — no free-form model text).
  - `executeTrades` — insert `trades` rows under
    `UNIQUE(decision_id, ticker, side)`, then deterministically recompute
    `holdings` from the full trade history. Idempotent by construction.
- `apps/web`: decision detail page renders the public summary, the
  tool-call audit log, and the linked macro brief + citations. No raw
  transcript fields anywhere on the page.

## Out of scope

- Production cron and production secrets (phase 7).
- Cloudflare Access policy for production admin routes (phase 7).
- Monitoring, alerting, runbook (phase 7).

## Verification

- Agents-SDK-on-Workers integration test: a Vitest case under
  `apps/agents` runs a one-tool agent against a stubbed OpenAI client
  inside `@cloudflare/vitest-pool-workers` with `nodejs_compat` enabled.
- Privacy test: scrape a real `GET /teams/:slug/decisions/:id` response
  from a preview deploy and assert it does **not** contain known raw
  transcript markers — for example `system_prompt`, `tool_call_id` wire
  format, full Perplexity body fields, or any internal IDs.
- Idempotency test: re-running the Workflow for the same `run_date` does
  not double-trade (verify `trades` row count unchanged) and `holdings`
  is byte-identical.
- Preview-env end-to-end: full daily run (manually triggered) produces
  trades plus a public decision page with sanitized reasoning that
  references the macro brief.
- Root `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test`
  all pass.
