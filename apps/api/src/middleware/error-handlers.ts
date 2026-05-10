import type { Logger } from "@repo/logger";
import type { Context, ErrorHandler } from "hono";
import type { AppEnv } from "../types";

export const onErrorHandler: ErrorHandler<AppEnv> = (err, c) => {
  // c.get types these as always-defined per AppEnv, but if onError fires
  // before loggerMiddleware runs (e.g. an upstream middleware throws) they
  // will be undefined at runtime. Read them defensively.
  const logger = c.get("logger") as Logger | undefined;
  const requestId = (c.get("requestId") as string | undefined) ?? "unknown";

  const meta = {
    requestId,
    method: c.req.method,
    path: c.req.path,
    error: err.message,
    stack: err.stack,
  };

  if (logger) {
    logger.error("unhandled error", meta);
  } else {
    console.error("unhandled error", meta);
  }

  return c.json({ error: "Internal Server Error" }, 500);
};

export const notFoundHandler = (c: Context<AppEnv>) =>
  c.json({ error: "not_found" }, 404);
