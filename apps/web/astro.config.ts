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
  // script-src and style-src are populated by Astro from collected hashes
  // for our inline hydration scripts and inline styles — do not set them
  // here. frame-ancestors is intentionally omitted: meta-tag CSP can't
  // express it; we set X-Frame-Options: DENY in the request middleware.
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "connect-src 'self' https://etf-arena-api.valuecodes.workers.dev",
        "font-src 'self' data:",
        "object-src 'none'",
        "base-uri 'none'",
        "form-action 'self'",
      ],
    },
  },
});
