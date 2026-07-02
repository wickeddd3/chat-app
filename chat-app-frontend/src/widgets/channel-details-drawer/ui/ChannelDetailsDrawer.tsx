import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/shared/ui/shadcn/drawer";
import { FaEllipsisVertical } from "react-icons/fa6";
import { ChannelDetails, type InboxChannel } from "@/entities/channel";
import { UpdateGroupChannel } from "@/features/channel/update-group-channel";
import { usePresence } from "@/entities/auth";

export interface ChannelDetailsDrawerProps {
  channel: InboxChannel | null;
}

export function ChannelDetailsDrawer({ channel }: ChannelDetailsDrawerProps) {
  const { isOnline } = usePresence();

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
          <FaEllipsisVertical className="h-4 w-4 text-muted-foreground" />
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
        <ChannelDetails channel={channel} isOnline={isOnline} />
      </DrawerContent>
    </Drawer>
  );
}
