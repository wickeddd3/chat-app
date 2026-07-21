import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createQueryKeys } from "@/shared/config/react-query-keys";

/** Minimal shape needed to name a typist — any member/user object satisfies it. */
export interface TypingParticipant {
  id: string;
  name?: string;
}

export interface UseTypingUsersParams {
  channelId: string;
  authId?: string;
  /** Roster to resolve ids against; an unmatched id falls back to "Someone". */
  participants?: TypingParticipant[];
}

/** Renders the roster as the sentence shown to the reader. */
export function formatTypingLabel(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return `${names[0]} is typing`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing`;

  const others = names.length - 1;
  return `${names[0]} and ${others} others are typing`;
}

/**
 * Reads the ephemeral typing roster the socket handler maintains for a channel.
 *
 * Deliberately a pure cache reader: it fetches nothing, so a list can call it
 * once per row without setting off a request per channel. Callers pass the
 * participants they already hold, and their own id to filter themselves out.
 */
export function useTypingUsers({
  channelId,
  authId,
  participants,
}: UseTypingUsersParams) {
  const keys = createQueryKeys(authId);

  // Cache-as-store: this entry is only ever written by `handleTypingStatus`,
  // never fetched, so the query stays disabled and just subscribes to it.
  const { data: typingUserIds = [] } = useQuery<string[]>({
    queryKey: keys.messages.typing(channelId),
    queryFn: () => [],
    enabled: false,
    initialData: [],
    staleTime: Infinity,
  });

  const names = useMemo(() => {
    if (typingUserIds.length === 0) return [];

    return typingUserIds
      .filter((userId) => userId !== authId)
      .map((userId) => {
        const participant = participants?.find(({ id }) => id === userId);
        // Someone we haven't loaded yet still deserves an indicator.
        return participant?.name ?? "Someone";
      });
  }, [typingUserIds, participants, authId]);

  return {
    isTyping: names.length > 0,
    label: formatTypingLabel(names),
  };
}
