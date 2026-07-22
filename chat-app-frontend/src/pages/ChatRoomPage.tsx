import { useParams } from "react-router";
import { lazy, Suspense, useMemo } from "react";
import { BackButton, ChannelHeader, useChannel } from "@/entities/channel";
import { useAuth, usePresence, usePresenceMap } from "@/entities/auth";
import {
  ChatRoom,
  ChannelUnavailablePlaceholder,
} from "@/features/message/chat-room";
import { Skeleton } from "@/shared/ui/shadcn/skeleton";

// The channel-info drawer pulls in the drawer runtime and the group-edit form,
// none of which the chat room itself needs — code-split it so it loads only
// when the header is first shown, keeping the room's critical path lean.
const ChannelDetailsDrawer = lazy(() =>
  import("@/widgets/channel-details-drawer").then((module) => ({
    default: module.ChannelDetailsDrawer,
  })),
);

// A pulsing skeleton shaped like the drawer's trigger button (p-2 + size-5
// icon → size-9), so the header shows a loading affordance and keeps its layout
// steady until the lazy drawer swaps in.
const DrawerTriggerFallback = () => (
  <Skeleton className="size-9 rounded-lg" aria-hidden />
);

export default function ChatRoomPage() {
  const { channelId } = useParams();
  const { authUser } = useAuth();
  const { channel, isLoading, error } = useChannel(
    channelId || "",
    authUser?.id,
  );
  const { isOnline } = usePresence();

  usePresenceMap(authUser?.id, channelId);

  // The channel is unreachable when the id is missing/invalid, the fetch failed
  // (not found / no access), or it resolved to nothing once loading settled.
  const isUnavailable = !channelId || !!error || (!isLoading && !channel);

  const online = useMemo(() => {
    if (!channel?.channelMembers) return false;

    return channel.channelMembers.some((member) => {
      if (member.user.id === authUser?.id) return false; // Skip checking authUser
      return isOnline(member.user.id);
    });
  }, [channel, authUser?.id, isOnline]);

  if (isUnavailable) {
    return (
      <div className="flex-1 flex flex-col h-full w-full bg-background">
        <div className="flex items-center w-full">
          <BackButton />
        </div>
        <ChannelUnavailablePlaceholder />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-background">
      <div className="flex items-center w-full">
        <BackButton />

        <div className="flex-1 py-3.5 pr-4 md:px-4">
          <ChannelHeader
            channel={channel}
            isOnline={online}
            optionSlot={
              <Suspense fallback={<DrawerTriggerFallback />}>
                <ChannelDetailsDrawer channel={channel} />
              </Suspense>
            }
          />
        </div>
      </div>

      <ChatRoom channelId={channelId || ""} />
    </div>
  );
}
