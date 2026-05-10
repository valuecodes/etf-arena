import type { MiddlewareHandler } from "hono";
import { env } from "../env";

const ALLOWED_METHODS = "GET, OPTIONS";
const ALLOWED_HEADERS = "Content-Type";
const MAX_AGE = "86400";

export const corsMiddleware = (): MiddlewareHandler => async (c, next) => {
  const origin = c.req.header("Origin");
  const isAllowed = origin === env.WEB_ORIGIN;

  if (c.req.method === "OPTIONS") {
    const headers = new Headers({ Vary: "Origin" });
    if (isAllowed) {
      headers.set("Access-Control-Allow-Origin", env.WEB_ORIGIN);
      headers.set("Access-Control-Allow-Methods", ALLOWED_METHODS);
      headers.set("Access-Control-Allow-Headers", ALLOWED_HEADERS);
      headers.set("Access-Control-Max-Age", MAX_AGE);
    }
    return new Response(null, { status: 204, headers });
  }

  await next();

  c.res.headers.set("Vary", "Origin");
  if (isAllowed) {
    c.res.headers.set("Access-Control-Allow-Origin", env.WEB_ORIGIN);
  }
};
