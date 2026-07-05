import { ROSTER, SEED_CONFIG, deriveEmail, rosterUsername } from "./config";
import { randomFullName } from "./helpers/content.helper";

/**
 * A login-able account the seeder will back with a Supabase Auth user. Every
 * seeded person (roster or generated) has one — there are no profile-only users.
 */
export interface AccountSpec {
  name: string;
  username: string;
  email: string;
  isRoster: boolean;
}

/** Builds the spec for a named roster account by its index (undefined if out of range). */
function rosterSpec(i: number): AccountSpec | undefined {
  const r = ROSTER[i];
  if (!r) return undefined;
  const username = rosterUsername(r.first, r.last);
  return { name: `${r.first} ${r.last}`, username, email: deriveEmail(username), isRoster: true };
}

/**
 * Builds the full ordered list of account specs the seeder will resolve to
 * Supabase Auth users. The order mirrors the connection buckets so slicing is
 * trivial: [primary, ...contacts, ...receivedRequesters, ...sentTargets].
 *
 * Named roster accounts are placed at the front of each bucket (e.g. Frank/Grace
 * lead the received bucket) so you can log in with their memorable emails to test
 * the other side of a request; the remainder are generated "member-NNNN" accounts.
 */
export function buildAccountSpecs(): AccountSpec[] {
  const { contacts, receivedRequests, sentRequests, generatedPrefix } = SEED_CONFIG;

  let generated = 0;
  const genSpec = (): AccountSpec => {
    generated++;
    const username = `${generatedPrefix}-${String(generated).padStart(4, "0")}`;
    return { name: randomFullName(), username, email: deriveEmail(username), isRoster: false };
  };

  // Fills a bucket to `size` using the given roster leaders first, then generated accounts.
  const bucket = (size: number, leaderIdx: number[]): AccountSpec[] => {
    const leaders = leaderIdx.map(rosterSpec).filter((s): s is AccountSpec => s !== undefined);
    const rest = Array.from({ length: Math.max(0, size - leaders.length) }, genSpec);
    return [...leaders, ...rest];
  };

  const primary = rosterSpec(0);
  if (!primary) throw new Error("roster.json must define at least the primary account");

  return [
    primary,
    ...bucket(contacts, [1, 2, 3, 4, 9]), // Bob, Carol, Dave, Erin, Judy + generated
    ...bucket(receivedRequests, [5, 6]), // Frank, Grace + generated
    ...bucket(sentRequests, [7, 8]), // Heidi, Ivan + generated
  ];
}
