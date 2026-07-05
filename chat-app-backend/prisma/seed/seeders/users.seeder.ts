import { prisma } from "@/lib/prisma";
import { SEED_CONFIG } from "../config";
import { buildAccountSpecs } from "../accounts";
import { createAuthUser, loadAuthUserMap } from "../helpers/auth.helper";
import { mapWithConcurrency } from "../helpers/async.helper";
import { randomAvatar } from "../helpers/content.helper";
import type { AuthMode, SeededUser } from "../types";

/**
 * Seeds every account (each backed by a real Supabase Auth user) and returns
 * them in bucket order (index 0 = primary). Existing Auth users are reused by
 * email; in "create" mode missing ones are created, in "reuse" mode they are
 * required to already exist. Profile rows are then bulk-inserted.
 */
export async function seedUsers(mode: AuthMode): Promise<SeededUser[]> {
  const specs = buildAccountSpecs();
  console.log(`Resolving ${String(specs.length)} Supabase Auth users [mode: ${mode}]...`);

  // One listing up front so we can reuse existing accounts without per-user lookups.
  const existing = await loadAuthUserMap();
  let created = 0;
  let reused = 0;
  let failed = 0;

  const resolved = await mapWithConcurrency(specs, SEED_CONFIG.authConcurrency, async (spec) => {
    let id = existing.get(spec.email);
    if (id) {
      reused++;
    } else if (mode === "create") {
      id = (await createAuthUser(spec.email, SEED_CONFIG.password)) ?? undefined;
      if (id) created++;
    }

    if (!id) {
      failed++;
      if (mode === "reuse") console.error(`❌ [reuse] No existing Auth user for ${spec.email}`);
      return null;
    }
    const user: SeededUser = {
      id,
      name: spec.name,
      username: spec.username,
      email: spec.email,
      isRoster: spec.isRoster,
    };
    return user;
  });

  const people = resolved.filter((u): u is SeededUser => u !== null);

  await prisma.user.createMany({
    data: people.map((u) => ({ id: u.id, name: u.name, username: u.username, image: randomAvatar() })),
  });

  console.log(
    `✅ Users: ${String(people.length)} resolved (${String(created)} created, ${String(reused)} reused, ${String(failed)} failed).`,
  );
  return people;
}
