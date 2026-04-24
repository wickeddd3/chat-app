import { ChatSidebar } from "@/widgets/navigation";
import { Outlet } from "react-router";

export function ChatLayout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <aside className="flex w-20 flex-col border-r bg-muted/30">
        <ChatSidebar />
      </aside>
      <main className="flex flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
