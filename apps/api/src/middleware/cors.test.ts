import { describe, expect, it } from "vitest";
import app from "../index";

describe("CORS", () => {
  it("preflight from the allowed origin returns the allow header", async () => {
    const res = await app.request("/teams", {
      method: "OPTIONS",
      headers: { Origin: "http://localhost:3000" },
    });
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
      "http://localhost:3000"
    );
    expect(res.headers.get("Access-Control-Allow-Methods")).toContain("GET");
  });

  it("preflight from a foreign origin omits the allow header", async () => {
    const res = await app.request("/teams", {
      method: "OPTIONS",
      headers: { Origin: "https://evil.example" },
    });
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("GET from the allowed origin echoes the allow header", async () => {
    const res = await app.request("/teams", {
      headers: { Origin: "http://localhost:3000" },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(
      "http://localhost:3000"
    );
  });

  it("GET from a foreign origin returns the body without the allow header", async () => {
    const res = await app.request("/teams", {
      headers: { Origin: "https://evil.example" },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });
});
