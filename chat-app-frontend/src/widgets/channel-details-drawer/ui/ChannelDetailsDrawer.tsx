import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/shared/ui/shadcn/drawer";
import { InfoIcon } from "lucide-react";
import type { InboxChannel } from "@/entities/channel";
import { ChannelDetails } from "@/features/channel/channel-details";
import { UpdateGroupChannel } from "@/features/channel/update-group-channel";

export function ChannelDetailsDrawer({
  channel,
}: {
  channel: InboxChannel | null;
}) {
  if (!channel) return;

  const isGroupChannel = channel.type === "GROUP";

  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <button
          className="p-2 rounded-lg cursor-pointer hover:bg-muted"
          aria-label="Channel info"
          role="button"
          title="Channel info"
        >
          <InfoIcon className="h-6 w-6 text-muted-foreground" />
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Info</DrawerTitle>
          <DrawerDescription className="flex justify-between items-center">
            <span className="text-sm">Channel details</span>
            {isGroupChannel && <UpdateGroupChannel channel={channel} />}
          </DrawerDescription>
        </DrawerHeader>
        <ChannelDetails channel={channel} />
      </DrawerContent>
    </Drawer>
  );
}
