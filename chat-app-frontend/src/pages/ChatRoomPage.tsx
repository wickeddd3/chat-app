import { useParams } from "react-router";
import { ChannelHeader, useChannel } from "@/entities/channel";
import { ChatRoom } from "@/features/message/chat-room";
import { InfoIcon } from "lucide-react";

export default function ChatRoomPage() {
  const { channelId } = useParams();
  const { channel } = useChannel(channelId || "");

  return (
    <div className="flex-1 flex flex-col">
      <ChannelHeader channel={channel} optionSlot={<InfoIcon />} />
      <ChatRoom channelId={channelId || ""} />
    </div>
  );
}
