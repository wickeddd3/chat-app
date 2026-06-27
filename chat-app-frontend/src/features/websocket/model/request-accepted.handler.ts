import type { QueryClient } from "@tanstack/react-query";
import type { Connection, ConnectionUser } from "@/entities/connection";
import type { User } from "@/entities/user";
import { REACT_QUERY_KEYS } from "@/shared/config/react-query-keys";

export const handleAcceptedRequest = (
  queryClient: QueryClient,
  connection: Connection,
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
            (req: Connection) => req.id !== connection.id,
          ),
        })),
      };
    },
  );

  const newContact: ConnectionUser = {
    id: connection?.user.id || "",
    name: connection?.user.name || "",
    username: connection?.user.username || "",
    image: connection?.user.image || "",
    updatedAt: new Date().toISOString(),
  };

  // Update contacts list to include the new contact
  queryClient.setQueryData(
    [...REACT_QUERY_KEYS["CONTACTS"], ""],
    (old: { pages: { contacts: ConnectionUser[] }[] }) => {
      if (!old) return old;

      return {
        ...old,
        pages: old.pages.map((page: { contacts: ConnectionUser[] }, index) => {
          // Prepend only to page index 0 (the initial loaded batch view)
          if (index === 0) {
            return {
              ...page,
              contacts: [newContact, ...page.contacts],
            };
          }
          return page;
        }),
      };
    },
  );

  // Update users list to update user connectionStatus
  queryClient.setQueryData(
    [...REACT_QUERY_KEYS["USERS"], ""],
    (old: User[]) => {
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
    },
  );
};
