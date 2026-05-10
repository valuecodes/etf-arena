import { env as rawEnv } from "cloudflare:workers";
import { z } from "zod";

const EnvSchema = z.object({
  WEB_ORIGIN: z.url(),
});

export type Env = z.infer<typeof EnvSchema>;

export const env: Env = EnvSchema.parse(rawEnv);
