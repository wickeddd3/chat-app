import { useQuery } from "@tanstack/react-query";
import { getChannel } from "../api/channels.api";
import type { Channel } from "./channel.types";

export function useChannel(targetUserId: string): {
  data: Channel | undefined;
  isLoading: boolean;
  error: unknown;
} {
  return useQuery({
    queryKey: ["channel", targetUserId],
    queryFn: () => getChannel(targetUserId),
    enabled: !!targetUserId,
  });
}
