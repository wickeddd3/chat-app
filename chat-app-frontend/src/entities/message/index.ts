export { MessageBubble } from "./ui/MessageBubble";
export { DayDivider } from "./ui/DayDivider";

export {
  groupMessages,
  startsRun,
  endsRun,
  RUN_GAP_MS,
} from "./model/message-grouping";
export type { RunPosition, GroupedMessage } from "./model/message-grouping";

export { useTypingUsers, formatTypingLabel } from "./model/useTypingUsers";
export type {
  TypingParticipant,
  UseTypingUsersParams,
} from "./model/useTypingUsers";

export type {
  MessageAuthor,
  Message,
  NewMessage,
  PaginatedMessage,
} from "./model/message.types";
