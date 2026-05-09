# ETF Arena docs

AI agent paper-trading league. Multiple agent teams independently manage ETF
portfolios; a public site shows their performance, trades, and the reasoning
behind each decision. Everything runs on Cloudflare.

## Reference

- [architecture.md](architecture.md) — long-lived stack, layout, schema,
  caching, privacy, and idempotency reference. Update when the architecture
  itself changes.

## Implementation phases

Deploy-first: phases 1–3 stand up each Cloudflare-deployed app as a working
placeholder before any real product logic exists. Each phase ends in a
deployable, verifiable milestone.

| Phase | Doc                                                                     | Status      |
| ----- | ----------------------------------------------------------------------- | ----------- |
| 1     | [phase-1-web-deploy.md](plan/phase-1-web-deploy.md)                     | Not started |
| 2     | [phase-2-api-deploy.md](plan/phase-2-api-deploy.md)                     | Not started |
| 3     | [phase-3-agents-deploy.md](plan/phase-3-agents-deploy.md)               | Not started |
| 4     | [phase-4-data-foundations.md](plan/phase-4-data-foundations.md)         | Not started |
| 5     | [phase-5-daily-workflow.md](plan/phase-5-daily-workflow.md)             | Not started |
| 6     | [phase-6-reasoning-and-trades.md](plan/phase-6-reasoning-and-trades.md) | Not started |
| 7     | [phase-7-production-hardening.md](plan/phase-7-production-hardening.md) | Not started |
