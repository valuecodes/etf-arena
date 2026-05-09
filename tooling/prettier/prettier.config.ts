import type { Config } from "prettier";

const config: Config = {
  trailingComma: "es5",
  plugins: [
    "@ianvs/prettier-plugin-sort-imports",
    "prettier-plugin-astro",
    // Must be last per the plugin's docs so it can run after the
    // Astro/JSX/Vue/etc. parsers and sort the resulting class strings.
    "prettier-plugin-tailwindcss",
  ],
};

export default config;
