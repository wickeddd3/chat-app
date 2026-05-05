import { ChatInbox } from "@/features/channel/chat-inbox";
import { CreateGroupChannel } from "@/features/channel/create-group-channel";
import { Outlet } from "react-router";

export default function MessagesPage() {
  return (
    <div className="flex flex-1">
      <div className="flex-1 flex flex-col border-r">
        <div className="flex justify-between items-center p-4">
          <h1 className="text-base font-medium text-foreground">Chat Inbox</h1>
          <CreateGroupChannel />
        </div>
        <div className="flex-1">
          <ChatInbox />
        </div>
      </div>
      <Outlet />
    </div>
  );
}
