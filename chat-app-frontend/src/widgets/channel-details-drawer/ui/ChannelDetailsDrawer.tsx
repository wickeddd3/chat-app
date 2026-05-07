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

export function ChannelDetailsDrawer({
  channel,
}: {
  channel: InboxChannel | null;
}) {
  if (!channel) return;

  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <button className="cursor-pointer">
          <InfoIcon size={22} className="text-gray-600" />
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Info</DrawerTitle>
          <DrawerDescription>Channel details</DrawerDescription>
        </DrawerHeader>
        <ChannelDetails channel={channel} />
      </DrawerContent>
    </Drawer>
  );
}
