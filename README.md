# etf-arena

A pnpm monorepo. Apps and packages will be added under `apps/` and `packages/`.

## Structure

```
apps/         # applications (empty)
packages/     # shared libraries (empty)
tooling/
  eslint/     # shared ESLint config
  prettier/   # shared Prettier config
  typescript/ # shared TypeScript config
```

## Development

Requires Node 24.12.0 (see `.nvmrc`) and pnpm.

```sh
pnpm install          # install dependencies
pnpm dev              # start dev (parallel, all workspaces)
pnpm build            # build all workspaces
pnpm typecheck        # type checking
pnpm lint             # linting
pnpm test             # run tests
pnpm format:check     # check formatting
pnpm format           # fix formatting
```

See [AGENTS.md](AGENTS.md) for the agent quick-start.
