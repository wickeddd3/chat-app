import { useMutation, type UseMutateFunction } from "@tanstack/react-query";
import { getUserChannelApi } from "../api/channels.api";
import type { Channel } from "@/entities/channel";
import { useNavigate } from "react-router";

export function useChatNavigation(): {
  navigateToChannel: UseMutateFunction<Channel, Error, string, unknown>;
  isNavigating: boolean;
  error: unknown;
} {
  const navigate = useNavigate();

  const { mutate, isPending, error } = useMutation({
    mutationFn: (targetUserId: string) => getUserChannelApi(targetUserId),
    onSuccess: (channel: Channel) => {
      navigate(`/messages/${channel.id}`);
    },
  });

  return {
    navigateToChannel: mutate,
    isNavigating: isPending,
    error: error,
  };
}
