import { useQuery } from "@tanstack/react-query";
import { getChannel } from "../api/channels.api";
import type { InboxChannel } from "./channel.types";

export function useChannel(channelId: string): {
  channel: InboxChannel | null;
  isLoading: boolean;
  error: unknown;
} {
  const { data, isLoading, error } = useQuery({
    queryKey: ["channel", channelId],
    queryFn: () => getChannel(channelId),
    enabled: !!channelId,
  });

  return {
    channel: data || null,
    isLoading,
    error,
  };
}
