import { Hono } from "hono";
import { corsMiddleware } from "./middleware/cors";
import { onErrorHandler } from "./middleware/error-handlers";
import { loggerMiddleware } from "./middleware/logger";
import { healthRoute } from "./routes/health";
import { teamsRoute } from "./routes/teams";
import type { AppEnv } from "./types";

const app = new Hono<AppEnv>()
  .use("*", corsMiddleware())
  .use("*", loggerMiddleware)
  .onError(onErrorHandler)
  .route("/health", healthRoute)
  .route("/teams", teamsRoute);

export default app;
