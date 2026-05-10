import { Logger } from "@repo/logger";
import type { Env } from "./env";

const logger = new Logger({ context: "agents" });

export default {
  async scheduled(controller, env) {
    const runDate = new Date(controller.scheduledTime)
      .toISOString()
      .slice(0, 10);
    logger.info("scheduled fired (stub)", { runDate });

    const result = await env.API.invalidateAfterRun(runDate);
    logger.info("invalidateAfterRun returned", { runDate, result });
  },
} satisfies ExportedHandler<Env>;
