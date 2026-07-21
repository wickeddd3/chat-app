import { Tabs, TabsContent } from "@/shared/ui/shadcn/tabs";
import {
  SegmentedTabsList,
  SegmentedTabsTrigger,
  SegmentedTabBadge,
} from "@/shared/ui/SegmentedTabs";
import {
  SentRequests,
  useSentConnectionRequests,
} from "@/features/connection/sent-connection";
import {
  ReceivedRequests,
  useReceivedConnectionRequests,
} from "@/features/connection/received-connection";
import { AcceptButton } from "@/features/connection/accept-connection";
import { DeclineButton } from "@/features/connection/decline-connection";
import { CancelButton } from "@/features/connection/cancel-connection";
import { useAuth } from "@/entities/auth";

export default function ConnectionRequestsPage() {
  const { authUser } = useAuth();

  // The tabs live here but each list fetches inside its own component. Calling
  // the same hooks for the badge totals reuses the identical query keys, so
  // TanStack serves them from one shared cache entry rather than refetching.
  const { total: receivedTotal } = useReceivedConnectionRequests(authUser?.id);
  const { total: sentTotal } = useSentConnectionRequests(authUser?.id);

  return (
    <div className="flex-1 flex flex-col max-h-full border-r">
      <div className="flex justify-between items-center p-4">
        <h1 className="text-base font-medium text-foreground">
          Connection Requests
        </h1>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs defaultValue="received" className="flex-1 flex flex-col min-h-0">
          <SegmentedTabsList className="mx-4 shrink-0">
            <SegmentedTabsTrigger value="received">
              Received
              <SegmentedTabBadge>{receivedTotal}</SegmentedTabBadge>
            </SegmentedTabsTrigger>
            <SegmentedTabsTrigger value="sent">
              Sent
              <SegmentedTabBadge>{sentTotal}</SegmentedTabBadge>
            </SegmentedTabsTrigger>
          </SegmentedTabsList>
          <TabsContent
            value="received"
            className="flex-1 min-h-0 data-[state=active]:flex flex-col m-0"
          >
            <ReceivedRequests
              acceptButton={AcceptButton}
              declineButton={DeclineButton}
            />
          </TabsContent>
          <TabsContent
            value="sent"
            className="flex-1 min-h-0 data-[state=active]:flex flex-col m-0"
          >
            <SentRequests cancelButton={CancelButton} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
