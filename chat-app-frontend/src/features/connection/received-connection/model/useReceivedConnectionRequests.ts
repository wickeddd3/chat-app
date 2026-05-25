import { useQuery } from "@tanstack/react-query";
import { receivedConnectionRequestsApi } from "../api/connections.api";
import type { Connection } from "@/entities/connection";

export function useReceivedConnectionRequests(): {
  receivedRequests: Connection[];
  isLoading: boolean;
  isEmpty: boolean;
  error: unknown;
} {
  const { data, isLoading, error } = useQuery<Connection[], unknown>({
    queryKey: ["received-connection-request"],
    queryFn: receivedConnectionRequestsApi,
  });

  const receivedRequests = data ?? [];

  return {
    receivedRequests,
    isLoading,
    isEmpty: !isLoading && receivedRequests.length === 0,
    error,
  };
}
