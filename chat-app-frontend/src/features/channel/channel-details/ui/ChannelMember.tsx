import { usePresence } from "@/app/store/PresenceContext";
import type { ChannelMember as ChannelMemberType } from "@/entities/channel";
import { ProfileAvatar } from "@/shared/ui/ProfileAvatar";
import { useMemo } from "react";

export function ChannelMember({ member }: { member: ChannelMemberType }) {
  const { onlineUsers, isOnline } = usePresence();

  const online = useMemo(() => {
    return isOnline(member.user.id);
  }, [member, onlineUsers, isOnline]);

  return (
    <div
      key={member.id}
      className="w-full flex justify-between items-center cursor-pointer hover:bg-gray-50"
    >
      <div className="flex-1 flex items-center gap-4">
        <ProfileAvatar
          imageSrc={member?.user?.image || ""}
          size="lg"
          isOnline={online}
          badge={true}
        />
        <div className="flex flex-col">
          <h6 className="font-medium text-sm">{member?.user?.name}</h6>
        </div>
      </div>
      {online && <span className="text-xs text-gray-700">Online</span>}
    </div>
  );
}
