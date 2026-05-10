import { describe, expect, it } from "vitest";
import { applySecurityHeaders, SECURITY_HEADERS } from "./lib/security-headers";

describe("applySecurityHeaders", () => {
  it("sets every header from SECURITY_HEADERS on the response", () => {
    const response = new Response("ok");

    applySecurityHeaders(response);

    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      expect(response.headers.get(name)).toBe(value);
    }
  });

  it("sets the expected security header values", () => {
    expect(SECURITY_HEADERS["Strict-Transport-Security"]).toBe(
      "max-age=63072000; includeSubDomains; preload"
    );
    expect(SECURITY_HEADERS["X-Frame-Options"]).toBe("DENY");
    expect(SECURITY_HEADERS["X-Content-Type-Options"]).toBe("nosniff");
    expect(SECURITY_HEADERS["Referrer-Policy"]).toBe(
      "strict-origin-when-cross-origin"
    );
    expect(SECURITY_HEADERS["Permissions-Policy"]).toContain("camera=()");
    expect(SECURITY_HEADERS["Permissions-Policy"]).toContain("microphone=()");
    expect(SECURITY_HEADERS["Permissions-Policy"]).toContain("geolocation=()");
  });

  it("overwrites pre-existing values for the same header", () => {
    const response = new Response("ok", {
      headers: { "X-Frame-Options": "SAMEORIGIN" },
    });

    applySecurityHeaders(response);

    expect(response.headers.get("X-Frame-Options")).toBe("DENY");
  });

  it("does not touch unrelated headers", () => {
    const response = new Response("ok", {
      headers: { "X-Request-Id": "abc-123" },
    });

    applySecurityHeaders(response);

    expect(response.headers.get("X-Request-Id")).toBe("abc-123");
  });
});
