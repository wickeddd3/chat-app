import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { VirtuosoHandle } from "react-virtuoso";
import type { Message, NewMessage } from "@/entities/message";

/**
 * How many older pages a jump will pull in while hunting for its target. A quote
 * can point anywhere in the history; without a bound, one tap could walk a
 * years-long thread back to its first message.
 */
const MAX_PAGES_TO_LOAD = 10;

/** How long the jumped-to bubble stays flashed. */
const HIGHLIGHT_MS = 1600;

export interface UseJumpToMessageParams {
  messages: (Message | NewMessage)[];
  virtuosoRef: RefObject<VirtuosoHandle | null>;
  /** Virtuoso's index offset — a jump target's index is relative to it. */
  firstItemIndex: number;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}

/**
 * Scrolls the timeline to a message by id, loading older pages until it is
 * found, then flashes it.
 *
 * The target is usually not loaded — a quote outlives the page it was quoted
 * from — so the jump is a small state machine rather than a scroll call: it
 * re-runs on each new page and settles once the message appears, the history
 * runs out, or the page budget is spent.
 */
export function useJumpToMessage({
  messages,
  virtuosoRef,
  firstItemIndex,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: UseJumpToMessageParams) {
  // The hunt is a ref, not state: it is bookkeeping for the effect below, and
  // nothing renders from it. `attempt` is what restarts it when a jump begins.
  const hunt = useRef<{ messageId: string; pagesLoaded: number } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const jumpToMessage = useCallback((messageId: string) => {
    hunt.current = { messageId, pagesLoaded: 0 };
    setAttempt((previous) => previous + 1);
  }, []);

  useEffect(() => {
    const current = hunt.current;
    if (!current) return;

    // A fetch is already in flight — this effect re-runs with its page.
    if (isFetchingNextPage) return;

    const index = messages.findIndex(
      (message) => message.id === current.messageId,
    );

    if (index === -1) {
      if (hasNextPage && current.pagesLoaded < MAX_PAGES_TO_LOAD) {
        current.pagesLoaded += 1;
        fetchNextPage();
        return;
      }

      // Out of history or out of budget: stop rather than spin.
      hunt.current = null;
      return;
    }

    hunt.current = null;

    // Wait a frame before landing: a page that just arrived has not been
    // measured yet, and Virtuoso scrolls to a stale offset if asked too early.
    const frame = requestAnimationFrame(() => {
      virtuosoRef.current?.scrollToIndex({
        index: firstItemIndex + index,
        align: "center",
        behavior: "smooth",
      });
      setHighlightedId(current.messageId);
    });

    return () => cancelAnimationFrame(frame);
  }, [
    attempt,
    messages,
    firstItemIndex,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    virtuosoRef,
  ]);

  useEffect(() => {
    if (!highlightedId) return;

    const timer = setTimeout(() => setHighlightedId(null), HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [highlightedId]);

  return { jumpToMessage, highlightedId };
}
