import type { QueryClient } from "@tanstack/react-query";
import { removeConnectionRequest } from "@/entities/connection";
import { patchRecommendedUser } from "@/entities/user";
import type { ScopedQueryKeys } from "@/shared/config/react-query-keys";

export interface DeclinedRequestPayload {
  receiverId: string;
  connectionId: string;
}

export const handleDeclinedRequest = (
  queryClient: QueryClient,
  queryKeys: ScopedQueryKeys,
  payload: DeclinedRequestPayload,
) => {
  // Remove sent connection request from existing sent connection requests cache
  // (and drop the Sent tab total)
  removeConnectionRequest(
    queryClient,
    queryKeys.connections.sent(),
    payload.connectionId,
  );

  // Update users lists to update user connectionStatus
  patchRecommendedUser(queryClient, queryKeys, payload.receiverId, {
    connectionId: null,
    connectionStatus: "STRANGER",
  });
};
