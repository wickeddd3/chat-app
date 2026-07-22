import type { ChannelMember as ChannelMemberType } from "../model/channel.types";
import { ProfileAvatar } from "@/shared/ui/ProfileAvatar";
import { lastSeenLabel } from "@/shared/utils/date-format";

export interface ChannelMemberProps {
  member: ChannelMemberType;
  online?: boolean;
  /** ISO last-seen for an offline member; null when online or unknown. */
  lastSeen?: string | null;
}

export function ChannelMember({
  member,
  online = false,
  lastSeen = null,
}: ChannelMemberProps) {
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
      {online ? (
        <span className="text-xs text-muted-foreground">Online</span>
      ) : (
        lastSeen && (
          <span className="text-xs text-muted-foreground shrink-0 whitespace-nowrap">
            {lastSeenLabel(lastSeen)}
          </span>
        )
      )}
    </div>
  );
}
