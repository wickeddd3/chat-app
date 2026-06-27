import type { ReactNode } from "react";
import type { InboxChannel } from "../model/channel.types";
import { ProfileAvatar } from "@/shared/ui/ProfileAvatar";

export function ChannelHeader({
  channel,
  isOnline = false,
  optionSlot,
}: {
  channel: InboxChannel | null;
  isOnline?: boolean;
  optionSlot?: ReactNode;
}) {
  if (!channel) return;

  return (
    <div className="w-full flex justify-between items-center">
      <div className="flex items-center gap-4">
        <ProfileAvatar
          imageSrc={channel.displayImage || ""}
          isOnline={isOnline}
          badge={true}
        />
        <h1 className="text-md font-medium">{channel.displayName}</h1>
      </div>
      {optionSlot}
    </div>
  );
}
