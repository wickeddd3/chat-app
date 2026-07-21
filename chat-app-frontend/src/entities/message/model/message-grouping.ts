import { isSameDay, isValid } from "date-fns";
import type { Message, NewMessage } from "./message.types";

type ChatMessage = Message | NewMessage;

/** Where a message sits inside a run of consecutive messages from one author. */
export type RunPosition = "solo" | "first" | "mid" | "last";

export interface GroupedMessage {
  message: ChatMessage;
  position: RunPosition;
  /** First message of its calendar day — the timeline draws a divider above it. */
  startsDay: boolean;
}

/**
 * A run also breaks on a long pause, not just on a change of author: the run
 * carries a single timestamp, and one stamp shouldn't stand for messages sent
 * an hour apart.
 */
export const RUN_GAP_MS = 5 * 60 * 1000;

const dateOf = (message: ChatMessage) => new Date(message.createdAt);

/** Do these two adjacent messages belong to the same run? */
function isSameRun(previous: ChatMessage, next: ChatMessage): boolean {
  if (previous.author.id !== next.author.id) return false;

  const previousDate = dateOf(previous);
  const nextDate = dateOf(next);

  // A run must not straddle a day divider, which two messages minutes apart
  // either side of midnight otherwise would.
  if (!isSameDay(previousDate, nextDate)) return false;

  // Absolute, so a pair that arrives fractionally out of order still groups.
  // An unparseable date yields NaN, and every comparison against it is false —
  // which breaks the run, the safe direction to fail in.
  return Math.abs(nextDate.getTime() - previousDate.getTime()) <= RUN_GAP_MS;
}

/**
 * Does this message open a new calendar day? An undated message never does —
 * it would label the divider with nothing.
 */
function opensDay(previous: ChatMessage | undefined, message: ChatMessage) {
  const date = dateOf(message);
  if (!isValid(date)) return false;

  return !previous || !isSameDay(dateOf(previous), date);
}

/**
 * Tags each message with its position in its run, so a bubble can render the
 * author's avatar and name only at the top of a run and the timestamp only at
 * the bottom.
 */
export function groupMessages(messages: ChatMessage[]): GroupedMessage[] {
  return messages.map((message, index) => {
    const previous = messages[index - 1];
    const isFirst = index === 0 || !isSameRun(previous, message);
    const isLast =
      index === messages.length - 1 || !isSameRun(message, messages[index + 1]);

    const position: RunPosition = isFirst
      ? isLast
        ? "solo"
        : "first"
      : isLast
        ? "last"
        : "mid";

    return { message, position, startsDay: opensDay(previous, message) };
  });
}

/** The avatar and author name belong to the top of a run. */
export const startsRun = (position: RunPosition): boolean =>
  position === "first" || position === "solo";

/** The timestamp and delivery state belong to the bottom of a run. */
export const endsRun = (position: RunPosition): boolean =>
  position === "last" || position === "solo";
