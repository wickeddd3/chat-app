import config from "./data/config.json";
import roster from "./data/roster.json";
import type { AuthMode } from "./types";

/** Tunable seed volumes and knobs, loaded from data/config.json. */
export const SEED_CONFIG = config;

/** The fixed roster of login-able accounts, loaded from data/roster.json. */
export const ROSTER: { first: string; last: string }[] = roster;

/** Derives the lowercase username used for a roster account (e.g. "aliceanderson"). */
export function rosterUsername(first: string, last: string): string {
  return `${first}${last}`.toLowerCase();
}

/** Derives the deterministic login email for a seeded roster username. */
export function deriveEmail(username: string): string {
  return `${username}@example.com`;
}

/**
 * Chooses the auth strategy from CLI args: `--reuse-auth` (prod, reuse existing
 * Supabase users) vs. the default create-or-reuse behavior for local dev.
 */
export function resolveAuthMode(argv: string[]): AuthMode {
  return argv.includes("--reuse-auth") ? "reuse" : "create";
}
