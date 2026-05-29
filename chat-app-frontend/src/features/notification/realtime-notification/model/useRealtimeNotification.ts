import type { Notification } from "@/entities/notification";
import { webSocketClient } from "@/shared/lib/socket-io.client";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";

export function useRealTimeNotifications() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleIncomingNotification = (notification: Notification) => {
      // Optimistically update the infinite query notification cache list
      queryClient.setQueryData(["notifications"], (oldData: any) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page: any, index: number) => {
            // Prepend the brand new notification to the very first page (newest items)
            if (index === 0) {
              return {
                ...page,
                notifications: [notification, ...page.notifications],
              };
            }
            return page;
          }),
        };
      });

      // Trigger alert toast
      toast.info(notification.title, {
        description: notification.content,
      });
    };

    webSocketClient.on("new_notification", handleIncomingNotification);

    return () => {
      webSocketClient.off("new_notification", handleIncomingNotification);
    };
  }, [queryClient]);
}
