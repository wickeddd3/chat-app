import { useMutation, type UseMutateFunction } from "@tanstack/react-query";
import { getUserChannel } from "../api/channels.api";
import type { Channel } from "@/entities/channel";
import { useNavigate } from "react-router";

export function useChatNavigation(): {
  navigateToChannel: UseMutateFunction<Channel, Error, string, unknown>;
  isNavigating: boolean;
  error: unknown;
} {
  const navigate = useNavigate();

  const { mutate, isPending, error } = useMutation({
    mutationFn: (targetUserId: string) => getUserChannel(targetUserId),
    onSuccess: (channel: Channel) => {
      navigate(`/messages/${channel.id}`);
    },
    onError: (error) => {
      console.error("Failed to retrieve user channel:", error);
    },
  });

  return {
    navigateToChannel: mutate,
    isNavigating: isPending,
    error: error,
  };
}
