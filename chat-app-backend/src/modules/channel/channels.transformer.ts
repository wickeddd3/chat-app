import { InboxChannel } from "./channels.types";

export function channelToInboxChannel(channel: InboxChannel, authUserId: string) {
  const isDirect = channel.type === "DIRECT";
  const otherMember = isDirect ? channel?.channelMembers.find((m) => m.userId !== authUserId)?.user : null;
  const lastMessage = {
    content: channel.messages[0]?.content || "",
    createdAt: channel.messages[0]?.createdAt || "",
  };

  return {
    id: channel.id,
    type: channel.type,
    name: channel.name,
    channelMembers: channel.channelMembers,
    displayName: isDirect ? otherMember?.name : channel.name,
    displayImage: isDirect ? otherMember?.image : null,
    lastMessage,
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
