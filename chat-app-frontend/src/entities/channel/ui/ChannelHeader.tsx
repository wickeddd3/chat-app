import type { ReactNode } from "react";
import type { InboxChannel } from "../model/channel.types";
import { ProfileAvatar } from "@/shared/ui/ProfileAvatar";

export interface ChannelHeaderProps {
  channel: InboxChannel | null;
  isOnline?: boolean;
  optionSlot?: ReactNode;
}

export function ChannelHeader({
  channel,
  isOnline = false,
  optionSlot,
}: ChannelHeaderProps) {
  if (!channel) return;

  return (
    <div className="w-full flex justify-between items-center">
      <div className="flex items-center gap-4">
        <ProfileAvatar
          imageSrc={channel.displayImage || ""}
          isOnline={isOnline}
          badge={true}
        />
        <h2 className="text-md font-medium">{channel.displayName}</h2>
      </div>
      {optionSlot}
    </div>
  );
}
