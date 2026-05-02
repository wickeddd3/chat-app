import { useAuth } from "@/entities/auth";
import { Toaster } from "@/shared/ui/shadcn/sonner";
import { ChatSidebar } from "@/widgets/navigation";
import { Outlet } from "react-router";
import { useWebSocketConnect } from "@/features/message/websocket-connection";
import { useHeartbeat } from "@/features/message/online-presence";

export function ChatLayout() {
  const { authSession } = useAuth();
  useWebSocketConnect(!!authSession);
  useHeartbeat(!!authSession);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <aside className="flex w-20 flex-col border-r bg-muted/30">
        <ChatSidebar />
      </aside>
      <main className="flex flex-1 overflow-hidden">
        <Outlet />
      </main>
      <Toaster theme="light" />
    </div>
  );
}
