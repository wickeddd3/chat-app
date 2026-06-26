import type { QueryClient } from "@tanstack/react-query";
import type { Connection } from "@/entities/connection";
import { REACT_QUERY_KEYS } from "@/shared/config/react-query-keys";

// Remove connection request to received request cache
export const handleDeclinedRequest = (
  queryClient: QueryClient,
  connectionId: string,
) => {
  // Remove sent connection request from existing sent connection requests cache
  queryClient.setQueryData(
    REACT_QUERY_KEYS["SENT_CONNECTION_REQUESTS"],
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
