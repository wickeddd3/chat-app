import { SearchField } from "@/shared/ui/SearchField";
import { useUsers } from "../model/useUsers";
import { EmptyPlaceholder } from "./EmptyPlaceholder";
import { LoadingPlaceholder } from "./LoadingPlaceholder";
import { UserListItem } from "./UserListItem";
import { useState } from "react";
import { Virtuoso } from "react-virtuoso";
import { useAuth } from "@/entities/auth";

export function UserList({
  messageButton: MessageButton,
  sendButton: SendButton,
  cancelButton: CancelButton,
  declineButton: DeclineButton,
  acceptButton: AcceptButton,
}: {
  messageButton: React.ComponentType<{
    text: string;
    targetUserId: string;
  }>;
  sendButton: React.ComponentType<{
    text: string;
    receiverId: string;
  }>;
  cancelButton: React.ComponentType<{
    text: string;
    connectionRequestId: string;
    connectionRequestUserId: string;
  }>;
  declineButton: React.ComponentType<{
    text: string;
    connectionRequestId: string;
    connectionRequestUserId: string;
  }>;
  acceptButton: React.ComponentType<{
    text: string;
    connectionRequestId: string;
  }>;
}) {
  const [query, setQuery] = useState("");

  const { authUser } = useAuth();
  const { users, isLoading, isEmpty } = useUsers(authUser?.id, query);

  return (
    <div className="flex-1 flex flex-col border-r h-full min-h-0">
      <div className="p-4 shrink-0">
        <h1 className="text-base font-medium text-foreground">
          People you may know
        </h1>
      </div>
      <div className="shrink-0">
        <SearchField
          value={query}
          onChange={setQuery}
          className="px-4 pb-6 pt-1"
        />
      </div>
      <div className="flex-1 w-full overflow-hidden relative">
        {isLoading && <LoadingPlaceholder />}

        {!isEmpty && (
          <Virtuoso
            style={{
              height: "100%",
              width: "100%",
            }}
            data={users}
            itemContent={(_, user) => (
              <UserListItem
                key={user.id}
                user={user}
                optionSlot={
                  <>
                    {user.connectionStatus === "STRANGER" && (
                      <SendButton text="Add Contact" receiverId={user.id} />
                    )}
                    {user.connectionStatus === "CONTACT" && (
                      <MessageButton text="Message" targetUserId={user.id} />
                    )}
                    {user.connectionStatus === "PENDING_SENT" &&
                      user.connectionId && (
                        <CancelButton
                          text="Cancel Request"
                          connectionRequestId={user.connectionId}
                          connectionRequestUserId={user.id}
                        />
                      )}
                    {user.connectionStatus === "PENDING_RECEIVED" &&
                      user.connectionId && (
                        <>
                          <DeclineButton
                            text="Decline Request"
                            connectionRequestId={user.connectionId}
                            connectionRequestUserId={user.id}
                          />
                          <AcceptButton
                            text="Accept Request"
                            connectionRequestId={user.connectionId}
                          />
                        </>
                      )}
                  </>
                }
              />
            )}
          />
        )}

        {isEmpty && <EmptyPlaceholder />}
      </div>
    </div>
  );
}
