import type { ChannelMember as ChannelMemberType } from "@/entities/channel";
import { ChannelMember } from "./ChannelMember";

export function ChannelMembers({ members }: { members: ChannelMemberType[] }) {
  return (
    <div className="flex flex-col gap-2">
      {members.map((member) => (
        <ChannelMember key={member.id} member={member} />
      ))}
    </div>
  );
}
