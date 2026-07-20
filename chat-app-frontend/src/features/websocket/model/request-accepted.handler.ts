import type { QueryClient } from "@tanstack/react-query";
import {
  prependContact,
  removeConnectionRequest,
  type Connection,
  type ConnectionUser,
} from "@/entities/connection";
import type { User } from "@/entities/user";
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

  // Update contacts list (and its tab total) to include the new contact
  prependContact(queryClient, queryKeys.connections.contacts(""), newContact);

  // Update users list to update user connectionStatus
  queryClient.setQueryData(queryKeys.users.recommended(""), (old: User[]) => {
    if (!old) return old;

    const currentUsers = [...old];
    const userIndex = currentUsers.findIndex(
      (user) => user.id === newContact.id,
    );

    currentUsers[userIndex] = {
      ...currentUsers[userIndex],
      connectionStatus: "CONTACT",
    };

    return currentUsers;
  });
};
