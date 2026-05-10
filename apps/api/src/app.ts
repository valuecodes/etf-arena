import { Hono } from "hono";
import { etag } from "hono/etag";
import { secureHeaders } from "hono/secure-headers";
import { defaultNoStoreCacheControlMiddleware } from "./middleware/cache";
import { corsMiddleware } from "./middleware/cors";
import { notFoundHandler, onErrorHandler } from "./middleware/error-handlers";
import { loggerMiddleware } from "./middleware/logger";
import { healthRoute } from "./routes/health";
import { teamsRoute } from "./routes/teams";
import type { AppEnv } from "./types";

export const app = new Hono<AppEnv>();

app.use("*", secureHeaders());
app.use("*", corsMiddleware());
app.use("*", loggerMiddleware);
app.use("*", etag({ weak: true }));
app.use("*", defaultNoStoreCacheControlMiddleware);

app.onError(onErrorHandler);

app.route("/health", healthRoute);
app.route("/teams", teamsRoute);

app.notFound(notFoundHandler);
