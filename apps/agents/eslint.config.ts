import { baseConfig } from "@repo/eslint/base";
import { defineConfig } from "eslint/config";

export default defineConfig(
  { ignores: ["dist", ".wrangler", "worker-configuration.d.ts"] },
  ...baseConfig,
  {
    files: ["src/index.ts"],
    rules: { "import/no-default-export": "off" },
  }
);
