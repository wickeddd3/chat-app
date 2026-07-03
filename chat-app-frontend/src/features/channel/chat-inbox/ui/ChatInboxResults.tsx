import type { InboxChannel } from "@/entities/channel";
import { ChatInboxItem } from "./ChatInboxItem";
import { EmptyPlaceholder } from "./EmptyPlaceholder";
import { LoadingPlaceholder } from "./LoadingPlaceholder";
import { Virtuoso } from "react-virtuoso";
import { FaCircleNotch } from "react-icons/fa6";
import { motion } from "framer-motion";
import { fadeVariants } from "@/shared/lib/motion";

export interface ChatInboxResultsProps {
  isLoading?: boolean;
  isEmpty?: boolean;
  results: InboxChannel[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}

export function ChatInboxResults({
  isLoading = false,
  isEmpty = false,
  results,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: ChatInboxResultsProps) {
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
          components={{
            Footer: () =>
              isFetchingNextPage ? (
                <div className="py-4 flex justify-center">
                  <FaCircleNotch
                    size={20}
                    className="text-primary animate-spin"
                  />
                </div>
              ) : null,
          }}
        />
      )}

      {isEmpty && <EmptyPlaceholder />}
    </motion.div>
  );
}
