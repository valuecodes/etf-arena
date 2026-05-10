import { TeamDetailSchema, TeamsResponseSchema } from "@repo/types/api";
import { describe, expect, it } from "vitest";
import { teamDetailFixtures, teamFixtures } from "../data/fixtures";
import app from "../index";
import { PUBLIC_CACHE_CONTROL } from "../middleware/cache";

describe("GET /teams", () => {
  it("returns the fixture array shaped by TeamsResponseSchema", async () => {
    const res = await app.request("/teams");
    expect(res.status).toBe(200);
    const body: unknown = await res.json();
    expect(TeamsResponseSchema.parse(body)).toEqual(teamFixtures);
  });

  it("sets the public Cache-Control header", async () => {
    const res = await app.request("/teams");
    expect(res.headers.get("Cache-Control")).toBe(PUBLIC_CACHE_CONTROL);
  });
});

describe("GET /teams/:slug", () => {
  it("returns the matching detail for a known slug", async () => {
    const res = await app.request("/teams/alpha");
    expect(res.status).toBe(200);
    const body: unknown = await res.json();
    expect(TeamDetailSchema.parse(body)).toEqual(teamDetailFixtures.alpha);
  });

  it("returns 404 for an unknown slug", async () => {
    const res = await app.request("/teams/does-not-exist");
    expect(res.status).toBe(404);
  });
});

describe("fixture / schema alignment", () => {
  it("teamFixtures matches TeamsResponseSchema", () => {
    expect(() => {
      TeamsResponseSchema.parse(teamFixtures);
    }).not.toThrow();
  });

  it("each teamDetailFixture matches TeamDetailSchema", () => {
    for (const detail of Object.values(teamDetailFixtures)) {
      expect(() => {
        TeamDetailSchema.parse(detail);
      }).not.toThrow();
    }
  });
});
