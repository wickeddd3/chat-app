import type { QueryClient } from "@tanstack/react-query";
import {
  prependContact,
  removeConnectionRequest,
  type Connection,
  type ConnectionUser,
} from "@/entities/connection";
import { patchRecommendedUser } from "@/entities/user";
import type { ScopedQueryKeys } from "@/shared/config/react-query-keys";

export type AcceptedRequestPayload = Connection;

export const handleAcceptedRequest = (
  queryClient: QueryClient,
  queryKeys: ScopedQueryKeys,
  payload: AcceptedRequestPayload,
) => {
  const connection = payload;

  // Remove sent connection request from existing sent connection requests cache
  // (and drop the Sent tab total)
  removeConnectionRequest(
    queryClient,
    queryKeys.connections.sent(),
    connection.id,
  );

  const newContact: ConnectionUser = {
    id: connection?.user.id || "",
    name: connection?.user.name || "",
    username: connection?.user.username || "",
    image: connection?.user.image || "",
    updatedAt: new Date().toISOString(),
  };

  // Update contacts lists (and their tab totals) to include the new contact
  prependContact(queryClient, queryKeys, newContact);

  // Update users lists to update user connectionStatus
  patchRecommendedUser(queryClient, queryKeys, newContact.id, {
    connectionStatus: "CONTACT",
  });
};
