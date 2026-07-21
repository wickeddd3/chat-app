import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/entities/auth";
import { useChannel } from "@/entities/channel";
import { createQueryKeys } from "@/shared/config/react-query-keys";

/** Renders the roster as the sentence shown under the timeline. */
export function formatTypingLabel(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return `${names[0]} is typing`;
  if (names.length === 2) return `${names[0]} and ${names[1]} are typing`;

  const others = names.length - 1;
  return `${names[0]} and ${others} others are typing`;
}

/**
 * Reads the ephemeral typing roster the socket handler maintains for a channel
 * and resolves the ids against the channel's member list for display names.
 */
export function useTypingUsers(channelId: string) {
  const { authUser } = useAuth();
  const keys = createQueryKeys(authUser?.id);
  const { channel } = useChannel(channelId, authUser?.id);

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
      .filter((userId) => userId !== authUser?.id)
      .map((userId) => {
        const member = channel?.channelMembers?.find(
          (channelMember) => channelMember.user.id === userId,
        );
        // A member we haven't loaded yet still deserves an indicator.
        return member?.user.name ?? "Someone";
      });
  }, [typingUserIds, channel?.channelMembers, authUser?.id]);

  return {
    isTyping: names.length > 0,
    label: formatTypingLabel(names),
  };
}
