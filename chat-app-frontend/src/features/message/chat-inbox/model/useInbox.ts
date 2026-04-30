import { useQuery } from "@tanstack/react-query";
import { getInbox } from "../api/messages.api";
import type { InboxItem } from "@/entities/message";

export function useInbox(): {
  inbox: InboxItem[];
  isLoading: boolean;
  isEmpty: boolean;
  error: unknown;
} {
  const { data, isLoading, error } = useQuery<InboxItem[]>({
    queryKey: ["inbox"],
    queryFn: getInbox,
  });

  return {
    inbox: data ?? [],
    isLoading,
    isEmpty: !isLoading && !!!(data && data.length),
    error,
  };
}
