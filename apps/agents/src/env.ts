import type { ApiRpc } from "@repo/types/rpc";
import { env as rawEnv } from "cloudflare:workers";
import { z } from "zod";

const EnvSchema = z.object({});

export type Env = z.infer<typeof EnvSchema> & {
  API: ApiRpc;
};

export const env: z.infer<typeof EnvSchema> = EnvSchema.parse(rawEnv);
