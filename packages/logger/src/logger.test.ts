import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MockInstance } from "vitest";
import { Logger } from "./logger";
import type { LogEntry } from "./types";

type ConsoleSpy = MockInstance<(...args: unknown[]) => void>;

const parseLogEntry = (spy: ConsoleSpy): LogEntry => {
  const firstCall = spy.mock.calls[0] as unknown[] | undefined;
  expect(firstCall).toBeDefined();
  return JSON.parse(String(firstCall?.[0])) as LogEntry;
};

describe("Logger", () => {
  let consoleSpy: {
    debug: ConsoleSpy;
    log: ConsoleSpy;
    warn: ConsoleSpy;
    error: ConsoleSpy;
  };

  beforeEach(() => {
    consoleSpy = {
      debug: vi.spyOn(console, "debug").mockImplementation(() => undefined),
      log: vi.spyOn(console, "log").mockImplementation(() => undefined),
      warn: vi.spyOn(console, "warn").mockImplementation(() => undefined),
      error: vi.spyOn(console, "error").mockImplementation(() => undefined),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("structured output", () => {
    it("outputs JSON with timestamp, level, context, and message", () => {
      const logger = new Logger({ context: "test:unit" });
      logger.info("hello world");

      expect(consoleSpy.log).toHaveBeenCalledOnce();
      const entry = parseLogEntry(consoleSpy.log);
      expect(entry.level).toBe("info");
      expect(entry.context).toBe("test:unit");
      expect(entry.message).toBe("hello world");
      expect(entry.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
    });

    it("includes additional metadata in the log entry", () => {
      const logger = new Logger({ context: "api" });
      logger.info("request", {
        method: "GET",
        path: "/teams",
        statusCode: 200,
      });

      const entry = parseLogEntry(consoleSpy.log);
      expect(entry.method).toBe("GET");
      expect(entry.path).toBe("/teams");
      expect(entry.statusCode).toBe(200);
    });

    it("does not allow metadata to override reserved fields", () => {
      const logger = new Logger({ context: "api" });
      logger.warn("actual", {
        context: "spoofed",
        level: "debug",
        message: "spoofed",
        timestamp: "not-a-timestamp",
      });

      const entry = parseLogEntry(consoleSpy.warn);
      expect(entry.context).toBe("api");
      expect(entry.level).toBe("warn");
      expect(entry.message).toBe("actual");
      expect(entry.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
    });
  });

  describe("log level methods", () => {
    it("routes debug to console.debug", () => {
      const logger = new Logger({ context: "test" });
      logger.debug("debug message");
      expect(consoleSpy.debug).toHaveBeenCalledOnce();
    });

    it("routes info to console.log", () => {
      const logger = new Logger({ context: "test" });
      logger.info("info message");
      expect(consoleSpy.log).toHaveBeenCalledOnce();
    });

    it("routes warn to console.warn", () => {
      const logger = new Logger({ context: "test" });
      logger.warn("warn message");
      expect(consoleSpy.warn).toHaveBeenCalledOnce();
    });

    it("routes error to console.error", () => {
      const logger = new Logger({ context: "test" });
      logger.error("error message");
      expect(consoleSpy.error).toHaveBeenCalledOnce();
    });
  });

  describe("level filtering", () => {
    it("suppresses debug when minimum level is info", () => {
      const logger = new Logger({ context: "test", level: "info" });
      logger.debug("should be suppressed");
      logger.info("should appear");

      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.log).toHaveBeenCalledOnce();
    });

    it("suppresses debug and info when minimum level is warn", () => {
      const logger = new Logger({ context: "test", level: "warn" });
      logger.debug("suppressed");
      logger.info("suppressed");
      logger.warn("visible");
      logger.error("visible");

      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.log).not.toHaveBeenCalled();
      expect(consoleSpy.warn).toHaveBeenCalledOnce();
      expect(consoleSpy.error).toHaveBeenCalledOnce();
    });

    it("suppresses all except error when minimum level is error", () => {
      const logger = new Logger({ context: "test", level: "error" });
      logger.debug("suppressed");
      logger.info("suppressed");
      logger.warn("suppressed");
      logger.error("visible");

      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.log).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
      expect(consoleSpy.error).toHaveBeenCalledOnce();
    });

    it("defaults to debug level (all messages visible)", () => {
      const logger = new Logger({ context: "test" });
      logger.debug("d");
      logger.info("i");
      logger.warn("w");
      logger.error("e");

      expect(consoleSpy.debug).toHaveBeenCalledOnce();
      expect(consoleSpy.log).toHaveBeenCalledOnce();
      expect(consoleSpy.warn).toHaveBeenCalledOnce();
      expect(consoleSpy.error).toHaveBeenCalledOnce();
    });
  });

  describe("context", () => {
    it("includes the configured context in every log entry", () => {
      const logger = new Logger({ context: "api:teams" });
      logger.info("first");
      logger.warn("second");

      const infoEntry = parseLogEntry(consoleSpy.log);
      const warnEntry = parseLogEntry(consoleSpy.warn);
      expect(infoEntry.context).toBe("api:teams");
      expect(warnEntry.context).toBe("api:teams");
    });
  });

  describe("metadata redaction", () => {
    it("redacts top-level sensitive keys", () => {
      const logger = new Logger({ context: "api" });
      logger.info("auth", { authorization: "Bearer abc.def.ghi" });

      const entry = parseLogEntry(consoleSpy.log);
      expect(entry.authorization).toBe("[REDACTED]");
    });

    it("redacts nested sensitive keys while preserving structure", () => {
      const logger = new Logger({ context: "api" });
      logger.info("req", {
        method: "GET",
        headers: { Cookie: "sid=secret-value", "X-Trace-Id": "abc" },
      });

      const entry = parseLogEntry(consoleSpy.log);
      expect(entry.method).toBe("GET");
      const headers = entry.headers as Record<string, unknown>;
      expect(headers.Cookie).toBe("[REDACTED]");
      expect(headers["X-Trace-Id"]).toBe("abc");
    });

    it("matches keys case-insensitively and across casing styles", () => {
      const logger = new Logger({ context: "api" });
      logger.info("variants", {
        Authorization: "x",
        AUTHORIZATION: "x",
        "x-api-key": "x",
        apiKey: "x",
        API_KEY: "x",
        accessToken: "x",
        clientSecret: "x",
      });

      const entry = parseLogEntry(consoleSpy.log);
      expect(entry.Authorization).toBe("[REDACTED]");
      expect(entry.AUTHORIZATION).toBe("[REDACTED]");
      expect(entry["x-api-key"]).toBe("[REDACTED]");
      expect(entry.apiKey).toBe("[REDACTED]");
      expect(entry.API_KEY).toBe("[REDACTED]");
      expect(entry.accessToken).toBe("[REDACTED]");
      expect(entry.clientSecret).toBe("[REDACTED]");
    });

    it("leaves non-sensitive keys untouched", () => {
      const logger = new Logger({ context: "api" });
      logger.info("plain", {
        method: "GET",
        path: "/teams",
        statusCode: 200,
        duration: 12,
      });

      const entry = parseLogEntry(consoleSpy.log);
      expect(entry.method).toBe("GET");
      expect(entry.path).toBe("/teams");
      expect(entry.statusCode).toBe(200);
      expect(entry.duration).toBe(12);
    });

    it("redacts sensitive keys inside arrays of objects", () => {
      const logger = new Logger({ context: "api" });
      logger.info("batch", {
        items: [
          { id: 1, token: "a" },
          { id: 2, token: "b" },
        ],
      });

      const entry = parseLogEntry(consoleSpy.log);
      const items = entry.items as Record<string, unknown>[];
      expect(items[0]?.id).toBe(1);
      expect(items[0]?.token).toBe("[REDACTED]");
      expect(items[1]?.id).toBe(2);
      expect(items[1]?.token).toBe("[REDACTED]");
    });

    it("does not crash on cycles and caps deep nesting", () => {
      const logger = new Logger({ context: "api" });
      const cyclic: Record<string, unknown> = { name: "root" };
      cyclic.self = cyclic;

      expect(() => {
        logger.info("cycle", cyclic);
      }).not.toThrow();
    });
  });
});
