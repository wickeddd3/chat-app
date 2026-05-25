import { useQuery } from "@tanstack/react-query";
import { sentConnectionRequestsApi } from "../api/connections.api";
import type { Connection } from "@/entities/connection";

export function useSentConnectionRequests(): {
  sentRequests: Connection[];
  isLoading: boolean;
  isEmpty: boolean;
  error: unknown;
} {
  const { data, isLoading, error } = useQuery<Connection[], unknown>({
    queryKey: ["sent-connection-request"],
    queryFn: sentConnectionRequestsApi,
  });

  const sentRequests = data ?? [];

  return {
    sentRequests,
    isLoading,
    isEmpty: !isLoading && sentRequests.length === 0,
    error,
  };
}
