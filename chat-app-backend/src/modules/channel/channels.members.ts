import type { ChannelRole } from "@/prisma/enums";

/** A membership row to be inserted for a channel. */
export interface ChannelMemberRow {
  channelId: string;
  userId: string;
  role: ChannelRole;
}

/**
 * An existing membership row, as the leave path loads it. Carries the member's
 * display name so composing "X left the group" costs no extra round trip.
 */
export interface ExistingMember {
  userId: string;
  role: ChannelRole;
  joinedAt: Date;
  name: string;
}

/**
 * Membership composition rules — pure, so the "creator is always ADMIN, listed
 * once" invariant is unit-testable and lives in one place instead of being
 * re-spelled in the create and update paths.
 */

/** A direct channel's two participants, both plain members. */
export function directMemberRows(channelId: string, userId: string, targetUserId: string): ChannelMemberRow[] {
  return [
    { channelId, userId, role: "MEMBER" },
    { channelId, userId: targetUserId, role: "MEMBER" },
  ];
}

/**
 * A group's roster: the creator as ADMIN plus every other requested member,
 * de-duplicated so the admin is never also inserted as a plain member.
 */
export function groupMemberRows(channelId: string, adminId: string, memberIds: string[]): ChannelMemberRow[] {
  return [
    { channelId, userId: adminId, role: "ADMIN" },
    ...memberIds.filter((id) => id !== adminId).map((id) => ({ channelId, userId: id, role: "MEMBER" as const })),
  ];
}

/**
 * Who inherits ADMIN when `leavingUserId` walks out, or null if nobody needs to.
 *
 * Succession only fires when the group would otherwise be left with no admin at
 * all — if another admin remains, the roster is already fine. The longest-standing
 * remaining member takes over, with the user id as a tiebreaker so two identical
 * `joinedAt` values (a group created in a single `createMany`) still resolve to
 * the same person on every replay.
 */
export function nextAdminId(
  members: Pick<ExistingMember, "userId" | "role" | "joinedAt">[],
  leavingUserId: string,
): string | null {
  const remaining = members.filter((member) => member.userId !== leavingUserId);
  if (remaining.length === 0) return null;
  if (remaining.some((member) => member.role === "ADMIN")) return null;

  const successor = [...remaining].sort(
    (a, b) => a.joinedAt.getTime() - b.joinedAt.getTime() || a.userId.localeCompare(b.userId),
  )[0];

  return successor?.userId ?? null;
}
