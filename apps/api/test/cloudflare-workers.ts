// Test-only stub for the `cloudflare:workers` virtual module so vitest
// (running in node) can import env validators and WorkerEntrypoint
// classes that use the production pattern. Aliased in vitest.config.ts.

export const env = process.env as Record<string, string | undefined>;

// Minimal stand-in for the workers runtime base class. Tests drive the
// Hono `app` directly via `app.request(...)`; the WorkerEntrypoint
// subclass is never instantiated under vitest. We just need the symbol
// to exist so `extends WorkerEntrypoint<Env>` parses at module load.
export class WorkerEntrypoint<TEnv = unknown> {
  protected env: TEnv;
  protected ctx: ExecutionContext;

  constructor(ctx: ExecutionContext, env: TEnv) {
    this.ctx = ctx;
    this.env = env;
  }
}
