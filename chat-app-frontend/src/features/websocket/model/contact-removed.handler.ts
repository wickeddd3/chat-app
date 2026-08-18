import type { QueryClient } from "@tanstack/react-query";
import { removeContactFromLists } from "@/entities/connection";
import { closeDirectChannelWith } from "@/entities/channel";
import { patchRecommendedUser } from "@/entities/user";
import type { ScopedQueryKeys } from "@/shared/config/react-query-keys";

export interface ContactRemovedPayload {
  /** The user who removed us. */
  userId: string;
  connectionId: string;
}

/**
 * Applies a removal made by the *other* side. The remover patched their own
 * caches optimistically; this is the mirror for the party being removed, so the
 * contact disappears and their thread closes without waiting for a refetch.
 */
export const handleContactRemoved = (
  queryClient: QueryClient,
  queryKeys: ScopedQueryKeys,
  payload: ContactRemovedPayload,
) => {
  // Drop them from every cached contacts list (and its tab total)
  removeContactFromLists(queryClient, queryKeys, payload.userId);

  // They are a stranger again — user lists should offer "Connect" once more
  patchRecommendedUser(queryClient, queryKeys, payload.userId, {
    connectionStatus: "STRANGER",
    connectionId: null,
  });

  // Close the composer on their direct thread; the history stays readable
  closeDirectChannelWith(queryClient, payload.userId);
};
