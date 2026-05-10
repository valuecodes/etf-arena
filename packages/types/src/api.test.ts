import { describe, expect, it } from "vitest";
import type { TeamDetail, TeamsResponse } from "./api";
import { TeamDetailSchema, TeamSchema, TeamsResponseSchema } from "./api";

const baseTeam = {
  id: "t-1",
  slug: "alpha",
  name: "Alpha",
  persona: "value-tilted",
  nav: 1_000_000,
  rank: 1,
};

describe("TeamSchema", () => {
  it("accepts a valid team row", () => {
    expect(TeamSchema.parse(baseTeam)).toEqual(baseTeam);
  });

  it("rejects a missing required field", () => {
    const { name: _name, ...missing } = baseTeam;
    expect(TeamSchema.safeParse(missing).success).toBe(false);
  });

  it("rejects a non-positive rank", () => {
    expect(TeamSchema.safeParse({ ...baseTeam, rank: 0 }).success).toBe(false);
  });
});

describe("TeamsResponseSchema", () => {
  it("parses an array of teams", () => {
    const value: TeamsResponse = [
      baseTeam,
      { ...baseTeam, id: "t-2", slug: "beta", rank: 2 },
    ];
    expect(TeamsResponseSchema.parse(value)).toHaveLength(2);
  });
});

describe("TeamDetailSchema", () => {
  it("requires the detail-only fields", () => {
    expect(TeamDetailSchema.safeParse(baseTeam).success).toBe(false);
  });

  it("accepts a full detail row", () => {
    const detail: TeamDetail = {
      ...baseTeam,
      model: "gpt-5-mini",
      startingCash: 1_000_000,
      startedAt: "2026-05-01",
    };
    expect(TeamDetailSchema.parse(detail)).toEqual(detail);
  });
});
