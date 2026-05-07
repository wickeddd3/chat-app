import { useParams } from "react-router";
import { useMemo } from "react";
import { ChannelHeader, useChannel } from "@/entities/channel";
import { useAuth } from "@/entities/auth";
import { ChatRoom } from "@/features/message/chat-room";
import { usePresence } from "@/app/store/PresenceContext";
import { ChannelDetailsDrawer } from "@/widgets/channel-details-drawer";

export default function ChatRoomPage() {
  const { channelId } = useParams();
  const { channel } = useChannel(channelId || "");
  const { onlineUsers, isOnline } = usePresence();
  const { authId } = useAuth();

  const online = useMemo(() => {
    if (channel?.type === "GROUP") {
      return channel.channelMembers.some(
        (member) => member.user.id !== authId && isOnline(member.user.id),
      );
    }
    if (channel?.type === "DIRECT") {
      const otherUser = channel.channelMembers.find(
        (member) => member.user.id !== authId && isOnline(member.user.id),
      );
      return !!otherUser;
    }
    return false;
  }, [channel, authId, onlineUsers]);

  return (
    <div className="flex-1 flex flex-col">
      <ChannelHeader
        channel={channel}
        isOnline={online}
        optionSlot={<ChannelDetailsDrawer channel={channel} />}
      />
      <ChatRoom channelId={channelId || ""} />
    </div>
  );
}
