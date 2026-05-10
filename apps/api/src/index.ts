import { Logger } from "@repo/logger";
import type { ApiRpc } from "@repo/types/rpc";
import { WorkerEntrypoint } from "cloudflare:workers";
import { app } from "./app";
import type { Env } from "./env";

const rpcLogger = new Logger({ context: "api.rpc" });

export default class ApiEntrypoint
  extends WorkerEntrypoint<Env>
  implements ApiRpc
{
  fetch(request: Request): Response | Promise<Response> {
    return app.fetch(request, this.env, this.ctx);
  }

  invalidateAfterRun(runDate: string): Promise<{ status: "stub" }> {
    rpcLogger.info("invalidateAfterRun (stub)", { runDate });
    return Promise.resolve({ status: "stub" });
  }
}
