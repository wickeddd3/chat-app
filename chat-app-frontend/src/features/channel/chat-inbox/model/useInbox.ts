import { useQuery } from "@tanstack/react-query";
import { getInbox } from "../api/channels.api";
import type { InboxChannel } from "@/entities/channel";

export function useInbox(): {
  inbox: InboxChannel[];
  isLoading: boolean;
  isEmpty: boolean;
  error: unknown;
} {
  const { data, isLoading, error } = useQuery<InboxChannel[]>({
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
