import { env as rawEnv } from "cloudflare:workers";
import { z } from "zod";

const EnvSchema = z.object({
  API_BASE_URL: z.url(),
});

export const env = EnvSchema.parse(rawEnv);
