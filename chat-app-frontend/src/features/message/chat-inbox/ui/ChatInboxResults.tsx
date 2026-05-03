import type { InboxItem } from "@/entities/message";
import { ChatInboxItem } from "./ChatInboxItem";
import { EmptyPlaceholder } from "./EmptyPlaceholder";
import { LoadingPlaceholder } from "./LoadingPlaceholder";

export function ChatInboxResults({
  isLoading = false,
  isEmpty = false,
  results,
}: {
  isLoading?: boolean;
  isEmpty?: boolean;
  results: (InboxItem & { online: boolean })[];
}) {
  return (
    <div className="w-full h-full overflow-y-auto">
      {isLoading && <LoadingPlaceholder />}

      {results.map((inboxItem) => (
        <ChatInboxItem key={inboxItem.roomId} inboxItem={inboxItem} />
      ))}

      {isEmpty && <EmptyPlaceholder />}
    </div>
  );
}
