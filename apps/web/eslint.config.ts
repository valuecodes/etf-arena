import { baseConfig } from "@repo/eslint/base";
import { reactConfig } from "@repo/eslint/react";
import { defineConfig } from "eslint/config";

export default defineConfig(
  { ignores: ["dist", ".astro", ".wrangler", "worker-configuration.d.ts"] },
  ...baseConfig,
  ...reactConfig,
  {
    files: [
      "src/pages/**/*.{ts,tsx}",
      "src/layouts/**/*.{ts,tsx}",
      "src/components/**/*.tsx",
    ],
    rules: { "import/no-default-export": "off" },
  },
  {
    files: ["src/env.d.ts"],
    rules: { "@typescript-eslint/consistent-type-definitions": "off" },
  }
);
