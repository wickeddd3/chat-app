import type { ChannelMember as ChannelMemberType } from "../model/channel.types";
import { ProfileAvatar } from "@/shared/ui/ProfileAvatar";

export interface ChannelMemberProps {
  member: ChannelMemberType;
  online?: boolean;
}

export function ChannelMember({ member, online = false }: ChannelMemberProps) {
  return (
    <div
      key={member.id}
      className="w-full flex justify-between items-center cursor-pointer hover:bg-muted"
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
      {online && <span className="text-xs text-muted-foreground">Online</span>}
    </div>
  );
}
