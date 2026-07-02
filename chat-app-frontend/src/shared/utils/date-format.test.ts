import { dateToString, dateToNow, isLessThanADayOld } from "./date-format";

describe("dateToString", () => {
  it("formats a valid date as a locale time string", () => {
    const result = dateToString("2026-01-01T15:30:00.000Z");

    // Locale/timezone vary by machine, so assert shape rather than an exact value
    expect(result).toMatch(/^\d{1,2}:\d{2}(\s?[AP]M)?$/i);
  });
});

describe("dateToNow", () => {
  const now = new Date("2026-01-01T12:00:00.000Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns an empty string for an invalid date", () => {
    expect(dateToNow("not-a-date")).toBe("");
  });

  it("describes a past date relative to now, with a suffix", () => {
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();

    expect(dateToNow(fiveMinutesAgo)).toBe("5 minutes ago");
  });
});

describe("isLessThanADayOld", () => {
  const now = new Date("2026-01-01T12:00:00.000Z");

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns false for an invalid date", () => {
    expect(isLessThanADayOld("not-a-date")).toBe(false);
  });

  it("returns true for a date less than 24 hours old", () => {
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();

    expect(isLessThanADayOld(twoHoursAgo)).toBe(true);
  });

  it("returns false for a date 24 hours old or older", () => {
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    expect(isLessThanADayOld(oneDayAgo)).toBe(false);
  });
});
