import { useQuery } from "@tanstack/react-query";
import { getChannel } from "../api/channels.api";
import type { InboxChannel } from "./channel.types";
import { createQueryKeys } from "@/shared/config/react-query-keys";

export function useChannel(
  channelId: string,
  authId?: string,
): {
  channel: InboxChannel | null;
  isLoading: boolean;
  error: unknown;
} {
  const keys = createQueryKeys(authId);

  const { data, isLoading, error } = useQuery({
    queryKey: keys.channel.details(channelId),
    queryFn: () => getChannel(channelId),
    enabled: !!channelId,
  });

  return {
    channel: data || null,
    isLoading,
    error,
  };
}
