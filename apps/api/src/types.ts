import type { Logger } from "@repo/logger";
import type { Env } from "./env";

export type AppEnv = {
  Bindings: Env;
  Variables: {
    logger: Logger;
    requestId: string;
  };
};
