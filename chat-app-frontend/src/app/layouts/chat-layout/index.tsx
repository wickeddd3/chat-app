import { useAuth } from "@/app/store/AuthContext";
import { Toaster } from "@/shared/ui/shadcn/sonner";
import { ChatSidebar } from "@/widgets/navigation";
import { Outlet } from "react-router";
import { useWebSocketConnect } from "@/features/message/websocket-connection";
import {
  useHeartbeat,
  usePresenceCacheSync,
} from "@/features/message/online-presence";
import { useRealTimeNotifications } from "@/features/notification/realtime-notification";

export function ChatLayout() {
  const { authUser } = useAuth();
  useWebSocketConnect(!!authUser);
  useHeartbeat(!!authUser);
  usePresenceCacheSync();
  useRealTimeNotifications();

  return (
    <div className="flex flex-col-reverse md:flex-row h-screen w-full overflow-hidden bg-background">
      <aside
        className={`
          flex w-full h-16 border-t flex-col bg-muted/30 shrink-0
          md:border-r md:border-t-0 md:h-full md:w-20
        `}
      >
        <ChatSidebar />
      </aside>

      <main className="flex flex-1 w-full min-w-0 overflow-hidden">
        <Outlet />
      </main>

      <Toaster theme="light" />
    </div>
  );
}
