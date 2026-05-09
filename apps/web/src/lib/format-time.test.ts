import { describe, expect, it } from "vitest";
import { formatTime } from "./format-time";

describe("formatTime", () => {
  it("renders 24-hour HH:MM:SS in the requested time zone", () => {
    const fixed = new Date("2026-05-09T08:30:05Z");
    expect(formatTime(fixed, "UTC")).toBe("08:30:05");
  });

  it("respects an explicit non-UTC zone", () => {
    const fixed = new Date("2026-05-09T08:30:05Z");
    expect(formatTime(fixed, "Europe/Helsinki")).toBe("11:30:05");
  });
});
