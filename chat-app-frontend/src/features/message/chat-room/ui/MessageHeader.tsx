import { usePresence } from "@/entities/auth";
import type { InboxChannel } from "@/entities/channel";
import { ProfileAvatar } from "@/shared/ui/ProfileAvatar";
import { useMemo } from "react";

export function MessageHeader({
  channel,
  authId,
}: {
  channel: InboxChannel | null;
  authId: string;
}) {
  const { isOnline } = usePresence();

  const online = useMemo(() => {
    if (channel?.type === "GROUP") {
      return channel.channelMembers.some((member) => isOnline(member.user.id));
    }
    if (channel?.type === "DIRECT") {
      const otherUser = channel.channelMembers.find(
        (member) => member.user.id !== authId && isOnline(member.user.id),
      );
      return !!otherUser;
    }
    return false;
  }, [channel, authId, isOnline]);

  return (
    <div className="w-full py-5 px-4">
      <div className="flex items-center gap-4">
        <ProfileAvatar
          imageSrc={channel?.displayImage || ""}
          isOnline={online}
          badge={true}
        />
        <h1 className="text-md font-medium">{channel?.displayName}</h1>
      </div>
    </div>
  );
}
