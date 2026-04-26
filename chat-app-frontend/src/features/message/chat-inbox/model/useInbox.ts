import { useQuery } from "@tanstack/react-query";
import { getInbox } from "../api/messages.api";
import type { InboxItem } from "@/entities/message";

export function useInbox(): {
  data: Partial<InboxItem[]> | undefined;
  isLoading: boolean;
  error: unknown;
} {
  return useQuery({
    queryKey: ["inbox"],
    queryFn: getInbox,
  });
}
