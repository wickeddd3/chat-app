import type { ChannelRole } from "@/prisma/enums";

/** A membership row to be inserted for a channel. */
export interface ChannelMemberRow {
  channelId: string;
  userId: string;
  role: ChannelRole;
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
