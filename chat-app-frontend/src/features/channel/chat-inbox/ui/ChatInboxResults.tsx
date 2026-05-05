import type { InboxChannel } from "@/entities/channel";
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
  results: InboxChannel[];
}) {
  return (
    <div className="w-full h-full overflow-y-auto">
      {isLoading && <LoadingPlaceholder />}

      {results.map((inboxItem) => (
        <ChatInboxItem key={inboxItem.id} inboxItem={inboxItem} />
      ))}

      {isEmpty && <EmptyPlaceholder />}
    </div>
  );
}
