import type { InboxChannel } from "./channel.types";

/**
 * Whether `userId` is an ADMIN of the channel — the client-side mirror of the
 * backend authorization guard. Used to gate group-management controls (the
 * server still enforces it and returns 403 for non-admins).
 */
export function isChannelAdmin(
  channel: Pick<InboxChannel, "channelMembers">,
  userId: string | undefined,
): boolean {
  if (!userId) return false;
  return channel.channelMembers.some(
    (member) => member.user.id === userId && member.role === "ADMIN",
  );
}
