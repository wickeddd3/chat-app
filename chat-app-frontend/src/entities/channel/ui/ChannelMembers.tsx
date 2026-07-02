import type { ChannelMember as ChannelMemberType } from "../model/channel.types";
import { ChannelMember } from "./ChannelMember";

export function ChannelMembers({
  members,
  isOnline,
}: {
  members: ChannelMemberType[];
  isOnline: (userId: string) => boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      {members.map((member) => (
        <ChannelMember
          key={member.id}
          member={member}
          online={isOnline(member.user.id)}
        />
      ))}
    </div>
  );
}
