import type { InboxChannel } from "@/entities/channel";
import { ChatInboxItem } from "./ChatInboxItem";
import { EmptyPlaceholder } from "./EmptyPlaceholder";
import { LoadingPlaceholder } from "./LoadingPlaceholder";
import { Virtuoso, type Components } from "react-virtuoso";
import { CircleNotchIcon } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { fadeVariants } from "@/shared/lib/motion";
import { useMemo } from "react";

export interface ChatInboxResultsProps {
  isLoading?: boolean;
  isEmpty?: boolean;
  /** The active search, so an empty list can say why it is empty. */
  searchQuery?: string;
  results: InboxChannel[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}

export function ChatInboxResults({
  isLoading = false,
  isEmpty = false,
  searchQuery,
  results,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: ChatInboxResultsProps) {
  // Stable identity so Virtuoso keeps the footer mounted; only its reference
  // would otherwise change each render and restart the loading spinner.
  const components = useMemo<Components<InboxChannel>>(
    () => ({
      Footer: () =>
        isFetchingNextPage ? (
          <div className="py-4 flex justify-center">
            <CircleNotchIcon className="size-5 text-primary animate-spin" />
          </div>
        ) : null,
    }),
    [isFetchingNextPage],
  );

  return (
    <motion.div
      variants={fadeVariants}
      initial="initial"
      animate="animate"
      className="flex-1 h-full overflow-y-auto min-h-0 scrollbar-thin"
    >
      {isLoading && <LoadingPlaceholder />}

      {!isEmpty && (
        <Virtuoso
          style={{
            height: "100%",
            width: "100%",
          }}
          data={results}
          overscan={400}
          endReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          itemContent={(_, inboxItem) => (
            <ChatInboxItem key={inboxItem.id} inboxItem={inboxItem} />
          )}
          components={components}
        />
      )}

      {isEmpty && <EmptyPlaceholder searchQuery={searchQuery} />}
    </motion.div>
  );
}
