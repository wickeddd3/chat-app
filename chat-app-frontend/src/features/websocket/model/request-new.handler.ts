import type { QueryClient } from "@tanstack/react-query";
import type { Connection } from "@/entities/connection";
import { REACT_QUERY_KEYS } from "@/shared/config/react-query-keys";

// Append new connection request to received request cache
export const handleNewRequest = (
  queryClient: QueryClient,
  connection: Connection,
) => {
  queryClient.setQueryData(
    REACT_QUERY_KEYS["RECEIVED_CONNECTION_REQUESTS"],
    (old: { pages: { connections: Connection[] }[] }) => {
      if (!old) return old;

      return {
        ...old,
        pages: old.pages.map((page: { connections: Connection[] }, index) => {
          // Prepend only to page index 0 (the initial loaded batch view)
          if (index === 0) {
            return {
              ...page,
              connections: [connection, ...page.connections],
            };
          }
          return page;
        }),
      };
    },
  );
};
