import { Tabs, TabsContent } from "@/shared/ui/shadcn/tabs";
import {
  SegmentedTabsList,
  SegmentedTabsTrigger,
  SegmentedTabBadge,
} from "@/shared/ui/SegmentedTabs";
import { useNotifications } from "../model/useNotifications";
import { NotificationResults } from "./NotificationResults";
import { useAuth } from "@/entities/auth";

export interface NotificationListProps {
  onClick: (notificationIds: string[]) => void;
}

export function NotificationList({ onClick }: NotificationListProps) {
  const { authUser } = useAuth();

  // One server-filtered query per tab: the list content and the badge total both
  // come from the backend, so an unread notification on a later page is no longer
  // hidden just because it hasn't been paged into the "all" list yet.
  const all = useNotifications(authUser?.id, "all");
  const unread = useNotifications(authUser?.id, "unread");

  return (
    <Tabs defaultValue="all" className="flex-1 flex flex-col min-h-0">
      <SegmentedTabsList className="mx-4 shrink-0">
        <SegmentedTabsTrigger value="all">All</SegmentedTabsTrigger>
        <SegmentedTabsTrigger value="unread">
          Unread
          <SegmentedTabBadge>{unread.total}</SegmentedTabBadge>
        </SegmentedTabsTrigger>
      </SegmentedTabsList>
      <TabsContent
        value="all"
        className="flex-1 min-h-0 data-[state=active]:flex flex-col m-0"
      >
        <NotificationResults
          results={all.notifications}
          isLoading={all.isLoading}
          isEmpty={all.isEmpty}
          hasNextPage={all.hasNextPage}
          isFetchingNextPage={all.isFetchingNextPage}
          fetchNextPage={all.fetchNextPage}
          onClick={onClick}
        />
      </TabsContent>
      <TabsContent
        value="unread"
        className="flex-1 min-h-0 data-[state=active]:flex flex-col m-0"
      >
        <NotificationResults
          results={unread.notifications}
          isLoading={unread.isLoading}
          isEmpty={unread.isEmpty}
          hasNextPage={unread.hasNextPage}
          isFetchingNextPage={unread.isFetchingNextPage}
          fetchNextPage={unread.fetchNextPage}
          onClick={onClick}
        />
      </TabsContent>
    </Tabs>
  );
}
