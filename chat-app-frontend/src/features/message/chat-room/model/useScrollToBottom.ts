import type { Message, NewMessage } from "@/entities/message";
import { useEffect, useMemo, useRef } from "react";
import type { VirtuosoHandle } from "react-virtuoso";

export function useScrollToBottom({
  messages,
}: {
  messages: (Message | NewMessage)[];
}) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  // Establish a massive max boundary for virtual index layout calculations
  const MAX_INDEX = 50000;

  // Target the absolute newest message item
  const lastMessage = messages[messages.length - 1];

  // Build a unique tracker key for live additions.
  // This string ONLY changes if the bottom-most message's identity alters.
  // It remains completely untouched when older messages are loaded at the top.
  const liveMessageTrackerKey = useMemo(() => {
    if (!lastMessage) return "";
    // Fallback chain handles: real ID, optimistic clientId, or a text chunk fallback
    const uniqueId = lastMessage.id || (lastMessage as Message).clientId || "";
    return `${uniqueId}-${lastMessage.createdAt}`;
  }, [lastMessage]);

  useEffect(() => {
    if (!liveMessageTrackerKey) return;

    // ONLY fires when new message hits the bottom of the timeline.
    // When you load pages at the top, lastMessageId doesn't change, so this effect is skipped.
    requestAnimationFrame(() => {
      virtuosoRef.current?.scrollToIndex({
        index: MAX_INDEX - 1,
        behavior: "smooth",
      });
    });
  }, [liveMessageTrackerKey]); // Listen to the newest message ID,

  return {
    virtuosoRef,
    maxIndex: MAX_INDEX,
  };
}
