# Architecture

Persistent reference for ETF Arena. Update only when the architecture itself
changes. Phase docs in [plan/](plan/) cite this file rather than restating it.

## Stack

| Concern               | Choice                                                                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime               | Cloudflare Workers. `nodejs_compat` ON for `apps/agents` (required by `@openai/agents`); OFF for `apps/api` and `apps/web`.                                         |
| HTTP framework        | Hono on `apps/api`. The agents worker has no public HTTP surface.                                                                                                   |
| Orchestration         | Cloudflare Workflows (durable, retryable, step-based). One Workflow per daily run.                                                                                  |
| Agent loop            | `@openai/agents` (OpenAI Agents SDK, TypeScript) inside a Workflow step. Cloudflare is "limited support" upstream — pin a known-good version and keep a smoke test. |
| LLM                   | OpenAI API. Per-agent role model picked via env (small for tool roles, stronger for the PM role).                                                                   |
| Scheduling            | Cloudflare Cron Trigger on the agents worker.                                                                                                                       |
| Structured storage    | Cloudflare D1 + Drizzle ORM.                                                                                                                                        |
| Blob storage          | Cloudflare R2 — **private**: raw agent transcripts, raw Perplexity bodies, raw Polygon payloads.                                                                    |
| Cache / rate state    | Cloudflare KV — Polygon response cache, run-date markers, api-worker response cache.                                                                                |
| Market data           | Polygon.io REST: EOD aggregates, ticker reference, market-status endpoints.                                                                                         |
| News / macro research | Perplexity Sonar Deep Research (`sonar-deep-research`) with citations.                                                                                              |
| Frontend              | Astro on Cloudflare adapter, **on-demand SSR**. No Next-style ISR on Cloudflare; cache via api-worker KV + edge `Cache-Control`.                                    |
| Styling               | Tailwind CSS + a small set of shadcn-style React primitives.                                                                                                        |
| Charts                | `uplot` (cheap, fast). Recharts only if a page genuinely needs richer interaction.                                                                                  |
| Hosting (web)         | Cloudflare Workers Static Assets + Astro SSR routes (one Worker, the Astro adapter handles both).                                                                   |
| Deploy tool           | Wrangler per app, driven via pnpm scripts and per-app GitHub Actions.                                                                                               |
| Validation            | Zod (D1 row schemas, Polygon and Perplexity response schemas, agent IO).                                                                                            |
| Testing               | Vitest. `@cloudflare/vitest-pool-workers` for the agents worker (so `nodejs_compat` matches prod).                                                                  |
| Lint / format / types | Existing `tooling/eslint`, `tooling/prettier`, `tooling/typescript` packages — extend, do not duplicate.                                                            |

## Monorepo layout

```
apps/
  web/                     # Astro public site, Cloudflare Workers (SSR + static assets)
  api/                     # Public Hono Worker: read-only endpoints for web/clients
  agents/                  # Internal Worker: cron + Workflow, NOT publicly routable
packages/
  db/                      # Drizzle schema, migrations, ReadOnlyRepo / WriteRepo
  market-data/             # Typed Polygon.io client + Zod response schemas
  research/                # Perplexity Sonar client + citation parsing
  agents-core/             # Agent/tool definitions, OpenAI client, prompt assets
  types/                   # Cross-app Zod DTOs + inferred TS types (e.g. the api wire contract)
  ui/                      # (optional, can defer) React components shared by web
tooling/
  eslint/  prettier/  typescript/   # already exist, reused as-is
```

Every new app/package exposes `dev`, `build`, `typecheck`, `lint`, `test`
scripts so the existing root `pnpm -r --if-present <script>` fan-out keeps
working. The root `prettier` config (with `prettier-plugin-tailwindcss`)
covers the web app — do not add another Prettier config.

## Worker boundary & service bindings

- `apps/web` has no DB or storage bindings. It reads everything from
  `apps/api`.
- `apps/api` is the only **API** worker on a public hostname (e.g.
  `api.<domain>`); `apps/web` is also publicly served, on its own
  hostname, but holds no DB or storage bindings. `apps/api` holds D1,
  R2, and KV bindings, plus a **Service
  Binding to `apps/agents`** (used by admin actions to start runs). It
  also exposes a `WorkerEntrypoint` whose only RPC method is
  `invalidateAfterRun(runDate)` — called by the agents worker to purge
  KV cache keys.
- `apps/agents` is **not publicly routable**: no `routes` entry,
  `workers_dev = false`. Its `WorkerEntrypoint` exposes RPC methods
  (`triggerRun(date)`, `runStatus(date)`) consumed by `apps/api` via the
  Service Binding. The `scheduled` handler kicks off the daily Workflow
  on cron. The agents worker holds its **own Service Binding back to
  `apps/api`**, used solely to call `invalidateAfterRun(runDate)` after a
  run completes (Service Bindings are caller-side, so each direction
  needs its own binding).
- Admin actions (e.g. `POST /admin/run`) live on `apps/api` behind
  Cloudflare Access; on success they call into `apps/agents` over the
  api → agents Service Binding. There is no public HTTP path into the
  agents worker.

Cloudflare does not enforce per-binding read-only access on D1 or R2.
Read-only is enforced **at the application layer**: the api worker only
imports a `ReadOnlyRepo` from `@repo/db`, whose type surface exposes
`select` only. A Vitest case asserts this and a runtime test confirms
attempted writes throw.

## Storage model

### D1 schema (Drizzle)

Idempotency keys are enforced via `UNIQUE` / `PRIMARY KEY` constraints, not
prose. Every Workflow write is `INSERT … ON CONFLICT DO NOTHING` (or
`DO UPDATE` on the `runs` row).

- `teams(id, slug UNIQUE, name, persona, model, starting_cash, started_at, created_at)` —
  `starting_cash` is the durable initial cash balance set at team
  creation; `started_at` is the inclusive trade-history boundary used
  when recomputing cash and holdings (so a team that joins mid-history
  is not retroactively "in" earlier sessions).
- `agents(id, team_id, role, system_prompt)` — roles: `analyst`, `risk`, `pm`, …
- `runs(run_date PRIMARY KEY, status, started_at, finished_at, error)` —
  status: `pending` | `running` | `succeeded` | `failed` | `skipped` |
  `pending_close` (the last set when `openRun` finds the EOD bar
  isn't yet finalized; see _Cron & trading calendar_). One row per
  run-date, drives all idempotency.
- `team_runs(run_date, team_id, status, error, PRIMARY KEY(run_date, team_id))` —
  per-team status within a run; allows partial retries.
- `decisions(id, team_id, run_date, summary_public, transcript_r2_key, macro_brief_id, UNIQUE(team_id, run_date))`
- `portfolio_snapshots(team_id, run_date, cash, equity, nav, PRIMARY KEY(team_id, run_date))`
- `trades(id, team_id, run_date, ticker, side, qty, price, decision_id, UNIQUE(decision_id, ticker, side))` —
  re-running the same decision cannot insert duplicate fills.
- `holdings(team_id, ticker, qty, avg_cost, PRIMARY KEY(team_id, ticker))` —
  applied via deterministic recompute from the full `trades` history on
  each run, never incremental. **Cash** is not stored here; it is
  reconstructed as `teams.starting_cash + Σ(trade cashflows up to
run_date)` and persisted per-run on `portfolio_snapshots.cash`. NAV
  on the snapshot is `cash + Σ(qty × close_price)` for that run_date.
- `macro_briefs(run_date PRIMARY KEY, summary_public, body_r2_key)` — one row
  per date, shared across teams.
- `research_calls(id, team_id, run_date, query, query_hash, body_r2_key, UNIQUE(team_id, run_date, query_hash))` —
  `query_hash` is a stable hash (e.g. SHA-256) of the normalized query
  string; it is the column the UNIQUE index keys on so retries with the
  same query are idempotent.
- `citations(id, owner_kind, owner_id, url, title, snippet)` — owner is
  either a `macro_brief` or a `research_call`.

### R2 layout

R2 holds the private raw artifacts. Keys are deterministic so retries
overwrite safely:

- `transcripts/{run_date}/{team_id}.json` — raw OpenAI Agents SDK transcript.
- `macro/{run_date}.json` — raw Perplexity Deep Research body.
- `research/{run_date}/{team_id}/{queryHash}.json` — per-team Perplexity
  follow-ups.

The api worker never reads R2 transcript objects.

## Workflow shape (daily run)

`apps/agents/src/workflows/daily-run.ts` is a `WorkflowEntrypoint` with these
steps. Step 1 owns the `runs` row; every later step is guarded by it so
retries are safe.

1. `openRun` — `INSERT … ON CONFLICT DO UPDATE` on `runs(run_date)`. Run a
   trading-day + finalized-bar guard via Polygon market-status; on weekend /
   holiday / not-yet-final, set `status='skipped'` and exit.
2. `fetchPrices` — Polygon EOD aggregates for the universe (cached in KV).
3. `fetchMacroBrief` — one Perplexity Sonar Deep Research call per run-date.
   Raw body to R2; `summary_public` + citations to D1. Cached in KV under
   `research/macro/{YYYY-MM-DD}` so retries are free.
4. `markToMarket` — upsert `portfolio_snapshots` rows.
5. `runTeam` (fan-out per team) — execute the OpenAI Agents SDK pipeline
   with the macro brief injected and a `researchSector` tool available for
   follow-ups; persist the **raw** transcript to R2.
6. `publishDecision` (per team) — sanitization pass: produce
   `summary_public` + tool-call audit log from the raw R2 transcript via a
   constrained LLM pass + a pattern-based redactor. Upsert the `decisions`
   row with `UNIQUE(team_id, run_date)`.
7. `executeTrades` — insert `trades` rows under
   `UNIQUE(decision_id, ticker, side)`, then deterministically recompute
   `holdings` from the full trade history (idempotent by construction).
8. `closeRun + purgeApiCache` — flip `runs.status` to `succeeded`, then
   call the api worker over the Service Binding
   (`api.invalidateAfterRun(runDate)`) which deletes KV-cached response
   keys touched by the run (`teams:*`, `team:{slug}:*`,
   `decisions:{date}:*`, `macro-brief:{date}`).

## Caching & freshness

- Astro SSR responses set `Cache-Control: public, s-maxage=120,
stale-while-revalidate=86400` so the edge serves a hot copy and refreshes
  in the background. No client polling and no Next-style ISR (which the
  Cloudflare adapter does not provide).
- `apps/api` caches its responses in KV under structured keys (`teams:*`,
  `team:{slug}:*`, `decisions:{date}:*`, `macro-brief:{date}`). Each
  endpoint reads-through KV before hitting D1.
- After a successful run, the agents worker calls
  `api.invalidateAfterRun(runDate)` over the Service Binding; the api
  worker deletes the affected KV keys. Stale Astro responses self-refresh
  shortly after their `s-maxage` window.

## Privacy boundary

The site is public; agent reasoning is verbose and may contain prompt
internals or third-party content. Treat the boundary explicitly.

- **Private (R2 only, never served to public clients)**: raw OpenAI Agents
  SDK transcripts, full system prompts, hidden chain-of-thought, raw
  Perplexity bodies, raw Polygon payloads, internal IDs.
- **Public (D1 columns suffixed `_public`, served via api worker)**: a
  sanitized decision summary, the deterministic tool-call audit log (tool
  name, arguments, result-hash, latency — no free-form model text), a
  sanitized macro-brief summary, citation URLs/titles/snippets.
- Sanitization is a dedicated Workflow step (`publishDecision`) that
  produces `*_public` content from the private R2 transcript via a small
  constrained LLM pass plus a pattern-based redactor (API keys, internal
  URLs, PII heuristics). The api worker never reads R2 transcript objects.

## Cron & trading calendar

- Cloudflare Cron Triggers fire in UTC and have no DST awareness. US
  equity close is 21:00 UTC during EDT and 22:00 UTC during EST. Cron is
  set to **`5 22 * * 1-5`** (post-close in both zones).
- **`run_date` is the just-closed US market date** (the date on which the
  cron actually fires, in `America/New_York`). On a normal Monday at
  22:05 UTC the run processes Monday's session, not Friday's. The
  workflow derives `run_date` deterministically from the cron fire time,
  not from "yesterday."
- Before any LLM/Perplexity work, `openRun` calls Polygon market-status
  and the EOD aggregates endpoint and confirms the daily bar **for
  `run_date` itself** is present and marked finalized. If not yet final
  (rare slippage past 22:05 UTC), set `runs.status='pending_close'` and
  exit; a follow-up retry (manual via `/admin/run`, or the next day's
  cron reconciling via the `runs` table) finishes the run.
- On weekends or US market holidays, `openRun` writes a `runs` row with
  `status='skipped'` and exits before any paid API call.

## Cost / risk notes

- **OpenAI** is the dominant variable cost. Daily-only cadence keeps it
  bounded. Use smaller models for tool-only roles (analyst summarization)
  and a stronger model for the PM role only.
- **Polygon free tier** covers EOD aggregates and reference data, which is
  all the daily strategy needs initially.
- **Perplexity Deep Research** is the second-most expensive line item.
  Bound it by (a) one shared macro brief per run-date across all teams,
  cached in KV; (b) a per-team daily quota of `researchSector` calls (e.g. 2) enforced in the tool implementation; (c) skip on non-trading days.
- **D1 + R2 free tiers** comfortably cover this workload at expected
  volume.
- **Workflow idempotency** is enforced by schema (UNIQUE/PK constraints)
  plus deterministic recompute of `holdings`, not by prose. Steps can be
  freely retried by Workflows.
