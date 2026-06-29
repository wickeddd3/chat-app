import { useAuth } from "@/app/store/AuthContext";
import { Toaster } from "@/shared/ui/shadcn/sonner";
import { ChatSidebar } from "@/widgets/navigation";
import { Outlet, useParams } from "react-router";
import { SocketOrchestrator } from "@/features/websocket";

export function ChatLayout() {
  const { authUser } = useAuth();
  const { channelId } = useParams();
  const isInsideChatRoom = !!channelId;

  return (
    <div className="flex flex-col-reverse md:flex-row h-screen w-full overflow-hidden bg-background">
      <aside
        className={`
          flex w-full h-16 border-t flex-col bg-muted/30 shrink-0
          md:border-r md:border-t-0 md:h-full md:w-20
           ${isInsideChatRoom ? "hidden md:flex" : ""}
        `}
      >
        <ChatSidebar />
      </aside>

      <main className="flex flex-1 w-full min-w-0 overflow-hidden">
        <Outlet />
      </main>

      <Toaster theme="light" />

      <SocketOrchestrator authId={authUser?.id} />
    </div>
  );
}
