import { useInbox } from "../model/useInbox";
import { ChatInboxItem } from "./ChatInboxItem";
import { LoadingPlaceholder } from "./LoadingPlaceholder";
import { EmptyPlaceholder } from "./EmptyPlaceholder";

export function ChatInbox() {
  const { inbox, isLoading, isEmpty } = useInbox();

  return (
    <div className="flex-1 flex flex-col border-r">
      <div className="border-b p-4">
        <h1 className="text-base font-medium text-foreground">Chat Inbox</h1>
      </div>
      <div className="flex-1 w-full overflow-y-auto">
        {isLoading && <LoadingPlaceholder />}

        {inbox.map((inboxItem) => (
          <ChatInboxItem key={inboxItem.roomId} inboxItem={inboxItem} />
        ))}

        {isEmpty && <EmptyPlaceholder />}
      </div>
    </div>
  );
}
