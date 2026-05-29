import type { Connection } from "@/entities/connection";
import { REACT_QUERY_KEYS } from "@/shared/config/react-query-keys";

// Helper function to handle local cache updates across actions
export async function optimisticUpdate(
  connectionId: string,
  context: any,
): Promise<{ previousRequests: any } | void> {
  const queryKey = REACT_QUERY_KEYS["SENT_CONNECTION_REQUESTS"];

  // 1. Cancel outbound refetches so they don't overwrite our optimistic state
  await context.client.cancelQueries({ queryKey });

  // 2. Snapshot the previous value to restore if things break
  const previousRequests = context.client.getQueryData(queryKey);

  // 3. Optimistically update the cache by filtering out the item
  context.client.setQueryData(
    queryKey,
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

  // 4. Return the context object containing the rollback snapshot data
  return { previousRequests };
}
