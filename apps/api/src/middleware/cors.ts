import type { MiddlewareHandler } from "hono";
import { cors } from "hono/cors";
import { env } from "../env";

export const corsMiddleware = (): MiddlewareHandler =>
  cors({
    origin: env.WEB_ORIGIN,
    allowMethods: ["GET", "OPTIONS"],
  });
