/**
 * A seeded user. Every seeded user is backed by a real Supabase Auth account
 * (there are no profile-only users), so `email` is always present. Roster
 * accounts have memorable names; the rest are generated "member-NNNN" accounts.
 */
export interface SeededUser {
  id: string;
  name: string;
  username: string;
  email: string;
  isRoster: boolean;
}

/**
 * How the seeder obtains Supabase Auth ids:
 * - "create": create the account if missing, otherwise reuse it (local dev).
 * - "reuse": only look up existing accounts, never create (prod — overwrite
 *   business data against auth users that were already seeded).
 */
export type AuthMode = "create" | "reuse";
