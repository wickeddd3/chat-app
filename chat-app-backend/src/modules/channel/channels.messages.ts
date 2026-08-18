import type { NewSystemMessage } from "@/modules/message/messages.types";

/**
 * System-message copy for this domain's membership events.
 *
 * The wording belongs to the channel domain — it is what the event *means* — but
 * persisting it belongs to the message module, exactly as
 * `connections.notifications.ts` composes text the notifications module stores.
 *
 * A system line carries the member it is about as its author, so the row needs no
 * nullable author and the reader can still resolve a name and avatar; `SYSTEM` is
 * what keeps it out of unread counts and read receipts.
 */
export function memberLeftMessage(channelId: string, userId: string, name: string): NewSystemMessage {
  return {
    channelId,
    authorId: userId,
    type: "SYSTEM",
    content: `${name} left the group`,
  };
}
