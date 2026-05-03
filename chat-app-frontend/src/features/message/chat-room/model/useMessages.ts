import { useQuery } from "@tanstack/react-query";
import { getMessages } from "../api/messages.api";
import type { Message } from "@/entities/message";

export function useMessages(channelId: string): {
  messages: Message[];
  isLoading: boolean;
  isEmpty: boolean;
  error: unknown;
} {
  const { data, isLoading, error } = useQuery({
    queryKey: ["messages", channelId],
    queryFn: () => getMessages(channelId),
    enabled: !!channelId,
  });

  return {
    messages: data ?? [],
    isLoading,
    isEmpty: !isLoading && !!!(data && data.length),
    error,
  };
}
