import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
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
    // A missing/forbidden/invalid channel is a client error — don't retry it,
    // so the "channel unavailable" fallback shows immediately.
    retry: (failureCount, err) => {
      const status =
        err instanceof AxiosError ? err.response?.status : undefined;
      if (status && status >= 400 && status < 500) return false;
      return failureCount < 2;
    },
  });

  return {
    channel: data || null,
    isLoading,
    error,
  };
}
