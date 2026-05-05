import { InboxChannel } from "./channels.types";

export function channelToInboxChannel(channel: InboxChannel, authUserId: string) {
  const isDirect = channel.type === "DIRECT";
  const otherMember = isDirect ? channel?.channelMembers.find((m) => m.userId !== authUserId)?.user : null;
  const lastMessage = channel.messages[0]
    ? {
        content: channel.messages[0]?.content || "",
        createdAt: channel.messages[0]?.createdAt || "",
      }
    : null;

  return {
    id: channel.id,
    type: channel.type,
    name: channel.name,
    channelMembers: channel.channelMembers,
    displayName: isDirect ? otherMember?.name : channel.name,
    displayImage: isDirect ? otherMember?.image : null,
    lastMessage,
    unreadCount: channel?._count?.messages || 0,
  };
}

export function channelToChannelDetails(channel: InboxChannel, authUserId: string) {
  const isDirect = channel.type === "DIRECT";
  const otherMember = isDirect ? channel?.channelMembers.find((m) => m.userId !== authUserId)?.user : null;

  return {
    id: channel.id,
    type: channel.type,
    name: channel.name,
    channelMembers: channel.channelMembers,
    displayName: isDirect ? otherMember?.name : channel.name,
    displayImage: isDirect ? otherMember?.image : null,
    recipient: otherMember,
  };
}
