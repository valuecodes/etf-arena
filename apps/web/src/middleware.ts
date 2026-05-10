import { Logger } from "@repo/logger";
import { defineMiddleware } from "astro:middleware";
import { applySecurityHeaders } from "./lib/security-headers";

export const onRequest = defineMiddleware(async (context, next) => {
  const requestId = crypto.randomUUID();
  const logger = new Logger({ context: "web" });

  context.locals.logger = logger;
  context.locals.requestId = requestId;

  const method = context.request.method;
  const path = new URL(context.request.url).pathname;

  logger.info("request received", { requestId, method, path });

  const start = Date.now();
  try {
    const response = await next();
    response.headers.set("X-Request-Id", requestId);
    applySecurityHeaders(response);

    logger.info("request completed", {
      requestId,
      method,
      path,
      status: response.status,
      duration: Date.now() - start,
    });

    return response;
  } catch (err) {
    logger.error("request threw", {
      requestId,
      method,
      path,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      duration: Date.now() - start,
    });
    throw err;
  }
});
