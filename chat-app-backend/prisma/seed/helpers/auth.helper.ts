import { supabase } from "@/lib/supabase";
import { mapWithConcurrency, sleep } from "./async.helper";

/**
 * Loads every existing Supabase Auth user into an email→id map in one pass.
 * Doing this once (instead of per-account lookups) keeps reseeds and cleans fast
 * even with hundreds of accounts.
 */
export async function loadAuthUserMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const perPage = 1000;
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) break;
    for (const u of data.users) if (u.email) map.set(u.email, u.id);
    if (data.users.length < perPage) break;
  }
  return map;
}

/** Creates a confirmed Supabase Auth user, retrying once, returning its id (null on failure). */
export async function createAuthUser(email: string, password: string): Promise<string | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true });
    if (!error) return data.user.id;
    if (attempt === 0) await sleep(750); // brief backoff (e.g. transient rate limiting)
  }
  return null;
}

/**
 * Deletes the Supabase Auth users for the given emails, concurrently. Idempotent:
 * emails without a matching account are skipped. Returns the number deleted.
 */
export async function deleteAuthUsersByEmails(emails: string[], concurrency: number): Promise<number> {
  const map = await loadAuthUserMap();
  const targets = emails
    .map((email) => ({ email, id: map.get(email) }))
    .filter((t): t is { email: string; id: string } => Boolean(t.id));

  let deleted = 0;
  await mapWithConcurrency(targets, concurrency, async ({ email, id }) => {
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) console.error(`❌ Failed to delete Auth user ${email}:`, error.message);
    else deleted++;
  });

  console.log(`🗑️  Deleted ${String(deleted)} of ${String(emails.length)} Auth users.`);
  return deleted;
}
