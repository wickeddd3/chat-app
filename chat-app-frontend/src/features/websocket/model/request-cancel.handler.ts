import type { QueryClient } from "@tanstack/react-query";
import type { Connection } from "@/entities/connection";
import { REACT_QUERY_KEYS } from "@/shared/config/react-query-keys";

// Remove connection request to received request cache
export const handleCancelRequest = (
  queryClient: QueryClient,
  connectionId: string,
) => {
  queryClient.setQueryData(
    REACT_QUERY_KEYS["RECEIVED_CONNECTION_REQUESTS"],
    (old: { pages: { connections: Connection[] }[] }) => {
      if (!old) return old;

      return {
        ...old,
        // Map through each paginated page and filter out the canceled request
        pages: old.pages.map((page: { connections: Connection[] }) => ({
          ...page,
          connections: page.connections.filter(
            (req: Connection) => req.id !== connectionId,
          ),
        })),
      };
    },
  );
};
