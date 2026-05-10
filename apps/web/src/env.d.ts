/// <reference types="astro/client" />

import type { Logger } from "@repo/logger";

declare global {
  namespace App {
    // App.Locals is Astro's per-request store. It's defined here as an
    // `interface` (not a `type` alias) because Astro generates an empty
    // `App.Locals` interface and our declaration must merge with it.
    interface Locals {
      logger: Logger;
      requestId: string;
    }
  }
}
