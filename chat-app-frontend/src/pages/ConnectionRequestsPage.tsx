import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/ui/shadcn/tabs";
import { SentRequests } from "@/features/connection/sent-connection";
import { ReceivedRequests } from "@/features/connection/received-connection";
import { AcceptButton } from "@/features/connection/accept-connection";
import { DeclineButton } from "@/features/connection/decline-connection";
import { CancelButton } from "@/features/connection/cancel-connection";

export default function ConnectionRequestsPage() {
  return (
    <div className="flex-1 flex flex-col max-h-full border-r">
      <div className="flex justify-between items-center p-4">
        <h1 className="text-base font-medium text-foreground">
          Connection Requests
        </h1>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs defaultValue="received" className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-fit px-4 bg-transparent shrink-0">
            <TabsTrigger
              value="received"
              className="px-8 cursor-pointer rounded-full"
            >
              Received
            </TabsTrigger>
            <TabsTrigger
              value="sent"
              className="px-8 cursor-pointer rounded-full"
            >
              Sent
            </TabsTrigger>
          </TabsList>
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
