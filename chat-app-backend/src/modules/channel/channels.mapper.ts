import { InboxChannel } from "./channels.types";

export function channelToInboxChannel(channel: InboxChannel, authUserId: string) {
  const isDirect = channel.type === "DIRECT";

  const otherMember = isDirect ? channel.channelMembers.find((m) => m.userId !== authUserId)?.user : null;

  const firstMessage = channel.messages[0];
  const lastMessage = firstMessage
    ? {
        content: firstMessage.content,
        createdAt: firstMessage.createdAt,
        // An uncaptioned photo has empty content, which would preview as a blank
        // line — the flag lets the inbox say "Photo" instead.
        hasImage: !!firstMessage.imageUrl,
      }
    : null;

  return {
    id: channel.id,
    type: channel.type,
    name: channel.name,
    channelMembers: channel.channelMembers,
    displayName: isDirect ? (otherMember?.name ?? channel.name) : channel.name,
    // A direct thread shows the other person; a group shows its own avatar.
    displayImage: isDirect ? (otherMember?.image ?? null) : channel.image,
    lastMessage,
    unreadCount: channel._count.messages,
  };
}

/**
 * `canMessage` is resolved by the service (it depends on the connection table),
 * so it is passed in rather than derived from the row — the chat room uses it to
 * swap the composer for a "you can no longer message each other" notice.
 */
export function channelToChannelDetails(channel: InboxChannel, authUserId: string, canMessage: boolean) {
  const isDirect = channel.type === "DIRECT";

  const otherMember = isDirect ? channel.channelMembers.find((m) => m.userId !== authUserId)?.user : null;

  return {
    id: channel.id,
    type: channel.type,
    name: channel.name,
    channelMembers: channel.channelMembers,
    displayName: isDirect ? (otherMember?.name ?? channel.name) : channel.name,
    displayImage: isDirect ? (otherMember?.image ?? null) : channel.image,
    // The raw column, so an admin's upload dialog can show what is currently set
    // (displayImage conflates the two cases).
    image: channel.image,
    recipient: otherMember,
    canMessage,
  };
}
