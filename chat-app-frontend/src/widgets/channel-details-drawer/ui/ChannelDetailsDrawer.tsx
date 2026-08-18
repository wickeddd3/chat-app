import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/shared/ui/shadcn/drawer";
import { DotsThreeOutlineVerticalIcon } from "@phosphor-icons/react";
import {
  ChannelDetails,
  isChannelAdmin,
  type InboxChannel,
} from "@/entities/channel";
import { UpdateGroupChannel } from "@/features/channel/update-group-channel";
import { RemoveContactButton } from "@/features/connection/remove-contact";
import { useAuth, usePresence } from "@/entities/auth";

export interface ChannelDetailsDrawerProps {
  channel: InboxChannel | null;
}

export function ChannelDetailsDrawer({ channel }: ChannelDetailsDrawerProps) {
  const { isOnline, getLastSeen } = usePresence();
  const { authUser } = useAuth();

  if (!channel) return;

  const isGroupChannel = channel.type === "GROUP";

  // Only a group ADMIN may edit the channel; hide the control for everyone else
  // (the backend enforces this too, returning 403).
  const isAdmin = isChannelAdmin(channel, authUser?.id);

  // Offered only on a 1:1 thread that is still open — once the contact is gone
  // the channel is read-only and there is nothing left to remove.
  const canRemoveContact =
    !isGroupChannel && !!channel.recipient && channel.canMessage !== false;

  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <button
          className="p-2 rounded-lg cursor-pointer hover:bg-muted"
          aria-label="Channel info"
          role="button"
          title="Channel info"
        >
          <DotsThreeOutlineVerticalIcon weight="duotone" className="size-5" />
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Info</DrawerTitle>
          <DrawerDescription className="flex justify-between items-center">
            <span className="text-sm">Channel details</span>
            {isGroupChannel && isAdmin && (
              <UpdateGroupChannel channel={channel} />
            )}
          </DrawerDescription>
        </DrawerHeader>
        <ChannelDetails
          channel={channel}
          isOnline={isOnline}
          getLastSeen={getLastSeen}
        />
        {canRemoveContact && channel.recipient && (
          <div className="mt-auto border-t px-4 py-4">
            <RemoveContactButton
              targetUserId={channel.recipient.id}
              targetName={channel.recipient.name}
              layout="full"
            />
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
