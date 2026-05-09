# Phase 1 — Placeholder Astro App, Deployed

## Goal

Stand up a real Astro app on Cloudflare with a working URL and a placeholder
landing page. This proves the web deploy pipeline (Cloudflare adapter, build,
wrangler deploy from CI, custom domain or `*.workers.dev`) before any product
logic exists. Bundles the minimal monorepo bootstrap needed to make
`apps/web` real.

See [../architecture.md](../architecture.md) for the long-lived stack and
layout choices.

## Deliverables

- `apps/web/`: Astro app using `@astrojs/cloudflare` adapter, React +
  Tailwind integrations, `output: "server"`. One landing page with the
  product name, a one-paragraph description, and a "Coming soon" note. No
  data fetching, no api calls.
- `apps/web/wrangler.jsonc` (or `.toml`) wired for Workers Static Assets +
  SSR routes; production deploy target named `etf-arena-web`.
- `apps/web/package.json` scripts: `dev`, `build`, `typecheck`, `lint`,
  `test`, `deploy` (`wrangler deploy`).
- TypeScript / ESLint / Prettier configs that **extend** the existing
  `tooling/*` packages — do not duplicate config.
- CI: keep typecheck/lint/format/test in the existing workflows; add a
  separate `deploy-web.yml` (manual `workflow_dispatch` and/or push-to-main)
  using the `CLOUDFLARE_API_TOKEN` secret.

## Out of scope

- API worker (phase 2).
- Agents worker (phase 3).
- D1, R2, KV, OpenAI, Polygon, Perplexity (phase 4+).

## Verification

- `pnpm --filter web dev` serves the landing page locally.
- `pnpm --filter web build && pnpm --filter web deploy` (with Cloudflare
  credentials) produces a live URL; visiting it shows the placeholder.
- Root `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test` all
  pass; CI green on `main`.
