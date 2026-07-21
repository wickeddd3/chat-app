import { useAuth } from "@/entities/auth";
import { Toaster } from "@/shared/ui/Toaster";
import { ChatSidebar } from "@/widgets/navigation";
import { useParams } from "react-router";
import { SocketOrchestrator } from "@/features/websocket";
import { AnimatedOutlet } from "@/shared/ui/AnimatedOutlet";
import { SkipLink, MAIN_CONTENT_ID } from "@/shared/ui/SkipLink";
import { RouteAnnouncer } from "@/shared/ui/RouteAnnouncer";

// Animate per top-level section so navigating between chat rooms within
// /messages keeps the shared MessagesPage mounted (no re-animate / re-mount).
const sectionKey = (pathname: string) => pathname.split("/")[1] ?? "";

export function ChatLayout() {
  const { authUser } = useAuth();
  const { channelId } = useParams();
  const isInsideChatRoom = !!channelId;

  return (
    <div className="flex flex-col-reverse md:flex-row h-screen w-full overflow-hidden bg-background">
      <SkipLink />
      <RouteAnnouncer />
      <aside
        className={`
          flex w-full h-16 border-t flex-col bg-sidebar shrink-0
          md:border-r md:border-t-0 md:h-full md:w-20
           ${isInsideChatRoom ? "hidden md:flex" : ""}
        `}
      >
        <ChatSidebar />
      </aside>

      <main
        id={MAIN_CONTENT_ID}
        tabIndex={-1}
        className="flex flex-1 w-full min-w-0 overflow-hidden focus:outline-none"
      >
        <AnimatedOutlet
          getKey={sectionKey}
          className="flex flex-1 w-full min-w-0 h-full overflow-hidden"
        />
      </main>

      <Toaster />

      <SocketOrchestrator authId={authUser?.id} />
    </div>
  );
}
