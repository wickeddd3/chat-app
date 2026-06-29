import { useParams } from "react-router";
import { useMemo } from "react";
import { BackButton, ChannelHeader, useChannel } from "@/entities/channel";
import { useAuth } from "@/app/store/AuthContext";
import { ChatRoom } from "@/features/message/chat-room";
import { ChannelDetailsDrawer } from "@/widgets/channel-details-drawer";
import { usePresence } from "@/app/store/PresenceContext";
import { usePresenceMap } from "@/features/message/online-presence";

export default function ChatRoomPage() {
  const { channelId } = useParams();
  const { channel } = useChannel(channelId || "");
  const { authUser } = useAuth();
  const { isOnline } = usePresence();

  usePresenceMap(authUser?.id, channelId);

  const online = useMemo(() => {
    if (!channel?.channelMembers) return false;

    return channel.channelMembers.some((member) => {
      if (member.user.id === authUser?.id) return false; // Skip checking authUser
      return isOnline(member.user.id);
    });
  }, [channel, authUser?.id, isOnline]);

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-background">
      <div className="flex items-center w-full">
        <BackButton />

        <div className="flex-1 py-3.5 pr-4 md:px-4">
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
