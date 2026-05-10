import { env as rawEnv } from "cloudflare:workers";
import { z } from "zod";

const EnvSchema = z.object({
  WEB_ORIGIN: z.url().refine((value) => new URL(value).origin === value, {
    message: "WEB_ORIGIN must be an origin (no path, query, or trailing slash)",
  }),
});

export type Env = z.infer<typeof EnvSchema>;

export const env: Env = EnvSchema.parse(rawEnv);
