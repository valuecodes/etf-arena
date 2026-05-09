import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, sessionDrivers } from "astro/config";

export default defineConfig({
  output: "server",
  adapter: cloudflare({ imageService: "passthrough" }),
  integrations: [react()],
  server: { port: 3000 },
  vite: { plugins: [tailwindcss()] },
  // Sessions aren't used by the placeholder app, but Astro 6 always
  // initializes a driver. Using the in-memory lruCache driver keeps the
  // Cloudflare adapter from auto-adding a SESSION KV binding to the
  // generated wrangler config.
  session: { driver: sessionDrivers.lruCache() },
});
