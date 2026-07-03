import { useCallback, useEffect, useRef, useState } from "react";
import type { Message, NewMessage } from "@/entities/message";

type ChatMessage = Message | NewMessage;

/**
 * Stable identity across the optimistic (clientId) and confirmed (id) states.
 * A Message always has `id` and a NewMessage always has `clientId`, so the
 * final fallback is unreachable — it only satisfies the union's optionality.
 */
export const messageKey = (message: ChatMessage): string =>
  message.id ?? message.clientId ?? "";

const timeOf = (message: ChatMessage) => new Date(message.createdAt).getTime();

const newestTimeOf = (messages: ChatMessage[]) =>
  messages.reduce(
    (max, message) => Math.max(max, timeOf(message)),
    Number.NEGATIVE_INFINITY,
  );

/**
 * Flags messages that arrive *after* the room has mounted so only those get an
 * entrance animation — the initial page and older messages loaded via
 * pagination render at rest. Each flag is retired once the bubble finishes
 * animating (via `markAnimated`), so a bubble that scrolls out of the
 * virtualized list and back in does not replay its entrance.
 */
export function useNewMessageAnimation(messages: ChatMessage[]) {
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());
  const initializedRef = useRef(false);
  const newestTimeRef = useRef<number>(Number.NEGATIVE_INFINITY);

  useEffect(() => {
    if (!messages.length) return;

    // First non-empty render: treat everything as pre-existing (no animation).
    if (!initializedRef.current) {
      initializedRef.current = true;
      newestTimeRef.current = newestTimeOf(messages);
      return;
    }

    // Anything newer than the newest message we've seen is a genuine arrival
    // (new messages append to the tail; pagination prepends older ones).
    const prevNewest = newestTimeRef.current;
    const fresh = messages.filter((message) => timeOf(message) > prevNewest);
    if (!fresh.length) return;

    newestTimeRef.current = Math.max(prevNewest, newestTimeOf(fresh));
    setPendingIds((prev) => {
      const next = new Set(prev);
      fresh.forEach((message) => next.add(messageKey(message)));
      return next;
    });
  }, [messages]);

  const isNew = useCallback((id: string) => pendingIds.has(id), [pendingIds]);

  const markAnimated = useCallback((id: string) => {
    setPendingIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  return { isNew, markAnimated };
}
