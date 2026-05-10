import { Hono } from "hono";
import { teamDetailFixtures, teamFixtures } from "../data/fixtures";
import { publicCache } from "../middleware/cache";

export const teamsRoute = new Hono()
  .use("*", publicCache())
  .get("/", (c) => c.json(teamFixtures))
  .get("/:slug", (c) => {
    const slug = c.req.param("slug");
    const detail = teamDetailFixtures[slug];
    if (!detail) {
      return c.json({ error: "team_not_found" }, 404);
    }
    return c.json(detail);
  });
