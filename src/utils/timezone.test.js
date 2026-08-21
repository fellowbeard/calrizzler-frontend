import { describe, expect, it } from "vitest";
import {
  calculateEndTime,
  datePartsInTimezone,
  formatTimeInTimezone,
  timezoneAbbreviation,
  toDateTimeLocalValue,
} from "./timezone.js";

describe("timezone utilities", () => {
  it("returns a known timezone abbreviation", () => {
    expect(timezoneAbbreviation("America/New_York")).toBe("EST");
  });

  it("falls back to the timezone identifier when unknown", () => {
    expect(timezoneAbbreviation("Europe/London")).toBe("Europe/London");
  });

  it("returns empty output for missing date or timezone", () => {
    expect(formatTimeInTimezone(null, "America/New_York")).toBe("");
    expect(toDateTimeLocalValue("2026-01-15T17:30:00Z", "")).toBe("");
    expect(datePartsInTimezone(undefined, "America/New_York")).toBeNull();
  });

  it("converts an instant into date parts in the requested timezone", () => {
    expect(datePartsInTimezone("2026-01-15T02:30:00Z", "America/New_York")).toEqual({
      year: 2026,
      month: 1,
      day: 14,
    });
  });

  it("formats a datetime-local value in the requested timezone", () => {
    expect(toDateTimeLocalValue("2026-01-15T02:30:00Z", "America/New_York")).toBe("2026-01-14T21:30");
  });

  it("calculates an appointment end time from its duration", () => {
    const endTime = calculateEndTime("2026-01-15T17:30:00Z", 45);

    expect(endTime.toISOString()).toBe("2026-01-15T18:15:00.000Z");
  });
});
