import { ChatInbox } from "@/features/channel/chat-inbox";
import { Outlet } from "react-router";

export default function MessagesPage() {
  return (
    <div className="flex flex-1">
      <ChatInbox />
      <Outlet />
    </div>
  );
}
