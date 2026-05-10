import { describe, expect, it } from "vitest";
import { app } from "../app";

describe("GET /health", () => {
  it("returns 200 and { ok: true }", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("does not set a public Cache-Control", async () => {
    const res = await app.request("/health");
    const cacheControl = res.headers.get("Cache-Control");
    expect(cacheControl ?? "").not.toMatch(/public/);
  });
});
