import { queryClient } from "@/shared/lib/query.client";
import { webSocketClient } from "@/shared/lib/socket-io.client";
import { useEffect } from "react";

export function useInboxUpdate() {
  const handleRefetchInbox = () => {
    queryClient.invalidateQueries({ queryKey: ["inbox"] });
  };

  useEffect(() => {
    webSocketClient.on("inbox_updated", handleRefetchInbox);

    return () => {
      webSocketClient.off("inbox_updated", handleRefetchInbox);
    };
  }, []);
}
