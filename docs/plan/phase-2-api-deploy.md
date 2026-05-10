# Phase 2 — Placeholder API Worker, Deployed; Web Reads From It

## Goal

Deploy an `apps/api` Hono Worker to Cloudflare and switch the Astro app to
fetch its data from it. Proves the api deploy pipeline, the web ↔ api network
path, CORS, and the cache headers — all with canned data. No D1 yet.

See [../architecture.md](../architecture.md) for the worker boundary and
caching model.

## Deliverables

- `apps/api/`: Hono app on Cloudflare Workers. Endpoints return hard-coded
  JSON for now:
  - `GET /health` → `{ ok: true }`
  - `GET /teams` → 2-3 hard-coded leaderboard rows
  - `GET /teams/:slug` → hard-coded team detail
  - Each response sets the `Cache-Control` header from the architecture
    doc (`public, s-maxage=120, stale-while-revalidate=86400`). No KV
    layer yet — that arrives in phase 4 with real data.
- `apps/api/wrangler.jsonc`: production deploy target `etf-arena-api` on a
  hostname like `api.<domain>` (or `*.workers.dev`). CORS allows only the
  web origin.
- `apps/web` switches the landing page to a real leaderboard rendered from
  the api response. The api base URL is read from a build-time env var so
  dev points to `http://localhost:3001` and prod points to the deployed
  hostname.
- `packages/types/`: Zod schemas + inferred TypeScript types for the API
  wire contract (`Team`, `TeamsResponse`, `TeamDetail`), used by both
  apps — `apps/api` to validate fixtures match the schema, `apps/web` to
  parse the fetch response. Env validation lives **per-app** as small
  inline Zod schemas (not in the shared package).
- CI: add `deploy-api.yml` (manual `workflow_dispatch` and/or push-to-main).

## Out of scope

- Real persistence (phase 4).
- Admin endpoints / Service Bindings (phase 3).
- Decisions, macro briefs, raw transcripts.

## Verification

- `pnpm --filter api dev` + `pnpm --filter web dev`: leaderboard page
  fetches from the local api worker and renders.
- Both deployed to Cloudflare; visiting the production web URL shows the
  leaderboard backed by the production api URL.
- `curl <api>/teams` returns the canned JSON with the expected
  `Cache-Control` header.
- Root `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test` all
  pass.
