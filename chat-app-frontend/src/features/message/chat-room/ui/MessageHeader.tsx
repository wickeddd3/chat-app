import type { InboxChannel } from "@/entities/channel";
import { AvatarWithBadge } from "@/entities/message";

export function MessageHeader({ channel }: { channel: InboxChannel | null }) {
  if (!channel) return;

  return (
    <div className="w-full py-5 px-4">
      <div className="flex items-center gap-4">
        <AvatarWithBadge
          imageSrc={channel.displayImage || ""}
          isOnline={false}
        />
        <h1 className="text-md font-medium">{channel.displayName}</h1>
      </div>
    </div>
  );
}
