import type { MiddlewareHandler } from "hono";

export const PUBLIC_CACHE_CONTROL =
  "public, s-maxage=120, stale-while-revalidate=86400";

export const publicCache = (): MiddlewareHandler => async (c, next) => {
  await next();
  if (c.res.status >= 200 && c.res.status < 300) {
    c.res.headers.set("Cache-Control", PUBLIC_CACHE_CONTROL);
  }
};
