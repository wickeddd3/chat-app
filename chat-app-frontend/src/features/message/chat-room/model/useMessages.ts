import { useQuery } from "@tanstack/react-query";
import { getMessages } from "../api/messages.api";
import type { Message } from "@/entities/message";

export function useMessages(roomId: string): {
  data: Partial<Message[]> | undefined;
  isLoading: boolean;
  error: unknown;
} {
  return useQuery({
    queryKey: ["messages", roomId],
    queryFn: () => getMessages(roomId),
    enabled: !!roomId,
  });
}
