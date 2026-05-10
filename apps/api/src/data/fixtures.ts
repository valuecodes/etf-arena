import type { Team, TeamDetail } from "@repo/types/api";

const alpha: Team = {
  id: "t-alpha",
  slug: "alpha",
  name: "Alpha",
  persona: "Value-tilted, defensive sector mix",
  nav: 1_034_500,
  rank: 1,
};

const bravo: Team = {
  id: "t-bravo",
  slug: "bravo",
  name: "Bravo",
  persona: "Momentum-led, tech-heavy",
  nav: 1_021_800,
  rank: 2,
};

const charlie: Team = {
  id: "t-charlie",
  slug: "charlie",
  name: "Charlie",
  persona: "Macro-driven, broad index tilt",
  nav: 998_200,
  rank: 3,
};

export const teamFixtures: Team[] = [alpha, bravo, charlie];

export const teamDetailFixtures: Partial<Record<string, TeamDetail>> = {
  alpha: {
    ...alpha,
    model: "gpt-5-mini",
    startingCash: 1_000_000,
    startedAt: "2026-05-01",
  },
  bravo: {
    ...bravo,
    model: "gpt-5-mini",
    startingCash: 1_000_000,
    startedAt: "2026-05-01",
  },
  charlie: {
    ...charlie,
    model: "gpt-5",
    startingCash: 1_000_000,
    startedAt: "2026-05-01",
  },
};
