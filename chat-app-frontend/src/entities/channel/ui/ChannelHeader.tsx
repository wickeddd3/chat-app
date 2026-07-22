import type { ReactNode } from "react";
import type { InboxChannel } from "../model/channel.types";
import { ProfileAvatar } from "@/shared/ui/ProfileAvatar";
import { Skeleton } from "@/shared/ui/shadcn/skeleton";

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
  return (
    <div className="w-full flex justify-between items-center">
      <div className="flex items-center gap-4">
        {/* Loading and loaded share one layout — the skeleton mirrors the lg
            avatar (size-10) that anchors the row height, so the header no
            longer collapses and pops the avatar/name in once the channel
            resolves. */}
        {channel ? (
          <ProfileAvatar
            imageSrc={channel.displayImage || ""}
            isOnline={isOnline}
            badge={true}
          />
        ) : (
          <Skeleton className="size-10 shrink-0 rounded-full" />
        )}
        {channel ? (
          <h2 className="text-md font-medium">{channel.displayName}</h2>
        ) : (
          <Skeleton className="h-4 w-32" />
        )}
      </div>
      {optionSlot}
    </div>
  );
}
