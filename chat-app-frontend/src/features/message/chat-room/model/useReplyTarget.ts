import { useCallback, useState } from "react";
import type { Message, MessageParent, NewMessage } from "@/entities/message";

/**
 * The message the composer is currently replying to. It is the same shape the
 * server snapshots onto a sent reply, so the composer preview, the optimistic
 * bubble and the stored quote all render from one type.
 */
export type ReplyTarget = MessageParent;

/**
 * Holds the draft reply for a channel.
 *
 * The draft is per-thread: the chat room is reused across routes, so switching
 * channels must drop it rather than carry someone else's quote into a new
 * conversation.
 */
export function useReplyTarget(channelId: string) {
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [draftedFor, setDraftedFor] = useState(channelId);

  // Adjusted during render rather than in an effect (React's own alternative for
  // "state derived from a prop change"): the route reuses this component across
  // channels, so a stale draft would otherwise flash in the new thread for one
  // frame before an effect could clear it.
  if (draftedFor !== channelId) {
    setDraftedFor(channelId);
    setReplyTarget(null);
  }

  const replyTo = useCallback((message: Message | NewMessage) => {
    // An optimistic message has no server id yet, so nothing could point at it.
    if (!message.id) return;

    setReplyTarget({
      id: message.id,
      content: message.content,
      author: message.author,
      ...("type" in message && message.type ? { type: message.type } : {}),
    });
  }, []);

  const cancelReply = useCallback(() => setReplyTarget(null), []);

  return { replyTarget, replyTo, cancelReply };
}
