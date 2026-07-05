const DAY = 24 * 60 * 60 * 1000;
export const MINUTE = 60 * 1000;

/** A single fixed "now" reference so every timestamp in one seed run is consistent. */
export const SEED_NOW = Date.now();

/** Returns a Date `n` days before the seed's fixed "now" reference. */
export function daysAgo(n: number): Date {
  return new Date(SEED_NOW - n * DAY);
}

/** Advances an epoch-ms timestamp by `minutes`, clamped to just before "now". */
export function addMinutes(epochMs: number, minutes: number): number {
  return Math.min(epochMs + minutes * MINUTE, SEED_NOW - MINUTE);
}
