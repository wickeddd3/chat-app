import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { Message, PaginatedMessage } from "@/entities/message";
import type { InboxChannel } from "@/entities/channel";
import type { ScopedQueryKeys } from "@/shared/config/react-query-keys";

export interface ChannelMemberLeftPayload {
  channelId: string;
  /** Who left. */
  userId: string;
  /** Set when they were the last admin and someone inherited the role. */
  promotedAdminId: string | null;
  /** The "X left the group" line, absent when the channel was deleted. */
  systemMessage: Message | null;
}

/**
 * Applies a departure to the members who stayed: the leaver drops out of the
 * roster, any promotion is reflected, and the system line is appended to an open
 * timeline so the room narrates itself without a refetch.
 */
export const handleChannelMemberLeft = (
  queryClient: QueryClient,
  queryKeys: ScopedQueryKeys,
  payload: ChannelMemberLeftPayload,
) => {
  const { channelId, userId, promotedAdminId, systemMessage } = payload;

  // Roster + role, so the drawer stops listing them and the edit control appears
  // for whoever just inherited ADMIN.
  queryClient.setQueryData<InboxChannel>(
    queryKeys.channel.details(channelId),
    (channel) => {
      if (!channel) return channel;

      return {
        ...channel,
        channelMembers: channel.channelMembers
          .filter((member) => member.user.id !== userId)
          .map((member) =>
            member.user.id === promotedAdminId
              ? { ...member, role: "ADMIN" }
              : member,
          ),
      };
    },
  );

  if (!systemMessage) return;

  // Page 0 is the newest batch — `useMessages` reverses the pages before
  // flattening — so the newest message belongs at the end of it, exactly where
  // an incoming chat message lands. Idempotent on the message id, so a duplicate
  // event can't double-post the line.
  queryClient.setQueryData<InfiniteData<PaginatedMessage>>(
    queryKeys.messages.timeline(channelId),
    (data) => {
      if (!data) return data;

      const alreadyPresent = data.pages.some((page) =>
        page.messages.some((message) => message.id === systemMessage.id),
      );
      if (alreadyPresent) return data;

      const [newestPage, ...olderPages] = data.pages;
      if (!newestPage) return data;

      return {
        ...data,
        pages: [
          { ...newestPage, messages: [...newestPage.messages, systemMessage] },
          ...olderPages,
        ],
      };
    },
  );
};
