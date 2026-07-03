import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/ui/shadcn/tabs";
import { Badge } from "@/shared/ui/shadcn/badge";
import { useNotifications } from "../model/useNotifications";
import { NotificationResults } from "./NotificationResults";
import { useMemo } from "react";
import { useAuth } from "@/entities/auth";

export interface NotificationListProps {
  onClick: (notificationIds: string[]) => void;
}

export function NotificationList({ onClick }: NotificationListProps) {
  const { authUser } = useAuth();
  const {
    notifications,
    isLoading,
    isEmpty,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useNotifications(authUser?.id);

  const filteredByUnread = useMemo(() => {
    return notifications.filter((item) => !item.isRead);
  }, [notifications]);

  return (
    <Tabs defaultValue="all" className="flex-1 flex flex-col min-h-0">
      <TabsList className="w-fit px-4 bg-transparent shrink-0">
        <TabsTrigger value="all" className="px-4 cursor-pointer rounded-full">
          All
        </TabsTrigger>
        <TabsTrigger
          value="unread"
          className="px-4 cursor-pointer rounded-full"
        >
          Unread
          <Badge className="border-4 py-2.5 rounded-full border-background bg-muted text-foreground font-bold">
            {filteredByUnread.length}
          </Badge>
        </TabsTrigger>
      </TabsList>
      <TabsContent
        value="all"
        className="flex-1 min-h-0 data-[state=active]:flex flex-col m-0"
      >
        <NotificationResults
          results={notifications}
          isLoading={isLoading}
          isEmpty={isEmpty}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
          onClick={onClick}
        />
      </TabsContent>
      <TabsContent
        value="unread"
        className="flex-1 min-h-0 data-[state=active]:flex flex-col m-0"
      >
        <NotificationResults
          results={filteredByUnread}
          isLoading={isLoading}
          isEmpty={!filteredByUnread.length}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          fetchNextPage={fetchNextPage}
          onClick={onClick}
        />
      </TabsContent>
    </Tabs>
  );
}
