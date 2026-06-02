import { useParams } from "react-router";
import { useMemo } from "react";
import { BackButton, ChannelHeader, useChannel } from "@/entities/channel";
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
  }, [channel, authId, onlineUsers, isOnline]);

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-background">
      <div className="flex items-center w-full">
        <BackButton />

        <div className="flex-1">
          <ChannelHeader
            channel={channel}
            isOnline={online}
            optionSlot={<ChannelDetailsDrawer channel={channel} />}
          />
        </div>
      </div>

      <ChatRoom channelId={channelId || ""} />
    </div>
  );
}
