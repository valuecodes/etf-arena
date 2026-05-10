// Test-only stub for the `cloudflare:workers` virtual module so vitest
// (running in node) can import env validators that use the production
// pattern. Aliased in vitest.config.ts.
export const env = process.env as Record<string, string | undefined>;
