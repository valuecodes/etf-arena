import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { teamDetailFixtures, teamFixtures } from "../data/fixtures";
import { publicCache } from "../middleware/cache";

// The slug pattern excludes inherited object keys like `__proto__` so the
// fixture lookup below cannot fall through to a prototype value.
const SlugParamSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
});

export const teamsRoute = new Hono()
  .use("*", publicCache())
  .get("/", (c) => c.json(teamFixtures))
  .get("/:slug", zValidator("param", SlugParamSchema), (c) => {
    const { slug } = c.req.valid("param");
    const detail = teamDetailFixtures[slug];
    if (!detail) {
      return c.json({ error: "team_not_found" }, 404);
    }
    return c.json(detail);
  });
