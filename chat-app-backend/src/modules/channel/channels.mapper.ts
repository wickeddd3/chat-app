import { InboxChannel } from "./channels.types";

export function channelToInboxChannel(channel: InboxChannel, authUserId: string) {
  const isDirect = channel.type === "DIRECT";

  const otherMember = isDirect ? channel.channelMembers.find((m) => m.userId !== authUserId)?.user : null;

  const firstMessage = channel.messages[0];
  const lastMessage = firstMessage
    ? {
        content: firstMessage.content,
        createdAt: firstMessage.createdAt,
      }
    : null;

  return {
    id: channel.id,
    type: channel.type,
    name: channel.name,
    channelMembers: channel.channelMembers,
    displayName: isDirect ? (otherMember?.name ?? channel.name) : channel.name,
    displayImage: isDirect ? (otherMember?.image ?? null) : null,
    lastMessage,
    unreadCount: channel._count.messages,
  };
}

export function channelToChannelDetails(channel: InboxChannel, authUserId: string) {
  const isDirect = channel.type === "DIRECT";

  const otherMember = isDirect ? channel.channelMembers.find((m) => m.userId !== authUserId)?.user : null;

  return {
    id: channel.id,
    type: channel.type,
    name: channel.name,
    channelMembers: channel.channelMembers,
    displayName: isDirect ? (otherMember?.name ?? channel.name) : channel.name,
    displayImage: isDirect ? (otherMember?.image ?? null) : null,
    recipient: otherMember,
  };
}
