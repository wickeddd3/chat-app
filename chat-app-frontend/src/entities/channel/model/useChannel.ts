import { useQuery } from "@tanstack/react-query";
import { getChannel } from "../api/channels.api";
import type { InboxChannel } from "./channel.types";

export function useChannel(channelId: string): {
  data: InboxChannel | undefined;
  isLoading: boolean;
  error: unknown;
} {
  return useQuery({
    queryKey: ["channel", channelId],
    queryFn: () => getChannel(channelId),
    enabled: !!channelId,
  });
}
