import { InboxChannel } from "./channels.types";

export function channelToInboxChannel(channel: InboxChannel, authUserId: string) {
  const isDirect = channel.type === "DIRECT";
  const otherMember = isDirect ? channel?.channelMembers.find((m) => m.userId !== authUserId)?.user : null;

  return {
    ...channel,
    displayName: isDirect ? otherMember?.name : channel.name,
    displayImage: isDirect ? otherMember?.image : null,
    recipient: otherMember,
  };
}
