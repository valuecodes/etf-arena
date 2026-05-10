import type { LogEntry } from "@repo/logger";
import { Hono } from "hono";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockInstance } from "vitest";
import type { AppEnv } from "../types";
import { onErrorHandler } from "./error-handlers";
import { loggerMiddleware } from "./logger";

type ConsoleSpy = MockInstance<(...args: unknown[]) => void>;

const parseLogEntry = (spy: ConsoleSpy, callIndex = 0): LogEntry => {
  const call = spy.mock.calls[callIndex] as unknown[] | undefined;
  expect(call).toBeDefined();
  return JSON.parse(String(call?.[0])) as LogEntry;
};

describe("onErrorHandler", () => {
  let consoleSpy: {
    log: ConsoleSpy;
    error: ConsoleSpy;
  };

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, "log").mockImplementation(() => undefined),
      error: vi.spyOn(console, "error").mockImplementation(() => undefined),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs the error and returns a 500 JSON response", async () => {
    const app = new Hono<AppEnv>();
    app.use("*", loggerMiddleware);
    app.onError(onErrorHandler);
    app.get("/fail", () => {
      throw new Error("something broke");
    });

    const res = await app.request("/fail");
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.error).toBe("Internal Server Error");

    expect(consoleSpy.error).toHaveBeenCalled();
    const errorEntry = parseLogEntry(consoleSpy.error);
    expect(errorEntry.message).toBe("unhandled error");
    expect(errorEntry.error).toBe("something broke");
  });
});
