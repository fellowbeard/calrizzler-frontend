import { describe, expect, it } from "vitest";
import { formatRanges, formatTime, normalizeTime, validateRanges } from "./hours.js";

describe("hours helpers", () => {
  it("normalizes API timestamps to HH:MM", () => {
    expect(normalizeTime("2000-01-01T09:30:00.000Z")).toBe("09:30");
    expect(normalizeTime(null)).toBe("");
  });

  it("formats times for display", () => {
    expect(formatTime("00:15")).toBe("12:15 AM");
    expect(formatTime("13:05")).toBe("1:05 PM");
  });

  it("formats ranges in start-time order", () => {
    const ranges = [
      { opens_at: "13:00", closes_at: "17:00" },
      { opens_at: "09:00", closes_at: "12:00" },
    ];

    expect(formatRanges(ranges)).toBe("9:00 AM – 12:00 PM, 1:00 PM – 5:00 PM");
  });

  it("reports the first problem in a day's ranges", () => {
    expect(validateRanges([])).toBe("Add at least one time range.");
    expect(validateRanges([{ opens_at: "10:00", closes_at: "09:00" }])).toBe("Closing time must be after opening time.");
    expect(
      validateRanges([
        { opens_at: "09:00", closes_at: "12:00" },
        { opens_at: "11:00", closes_at: "14:00" },
      ])
    ).toBe("Working hours cannot overlap.");
    expect(validateRanges([{ opens_at: "09:00", closes_at: "17:00" }])).toBeNull();
  });
});
