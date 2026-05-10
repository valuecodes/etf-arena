import { Hono } from "hono";
import type { Env } from "./env";
import { corsMiddleware } from "./middleware/cors";
import { healthRoute } from "./routes/health";
import { teamsRoute } from "./routes/teams";

const app = new Hono<{ Bindings: Env }>()
  .use("*", corsMiddleware())
  .route("/health", healthRoute)
  .route("/teams", teamsRoute);

export default app;
