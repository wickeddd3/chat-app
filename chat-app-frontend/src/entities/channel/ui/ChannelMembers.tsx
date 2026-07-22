import type { ChannelMember as ChannelMemberType } from "../model/channel.types";
import { ChannelMember } from "./ChannelMember";

export interface ChannelMembersProps {
  members: ChannelMemberType[];
  isOnline: (userId: string) => boolean;
  getLastSeen: (userId: string) => string | null;
}

export function ChannelMembers({
  members,
  isOnline,
  getLastSeen,
}: ChannelMembersProps) {
  return (
    <div className="flex flex-col gap-2">
      {members.map((member) => {
        const online = isOnline(member.user.id);
        return (
          <ChannelMember
            key={member.id}
            member={member}
            online={online}
            lastSeen={online ? null : getLastSeen(member.user.id)}
          />
        );
      })}
    </div>
  );
}
