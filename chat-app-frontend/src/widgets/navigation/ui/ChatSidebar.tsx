import { MessageCircleDashedIcon } from "lucide-react";
import { useLocation } from "react-router";
import { UserNav } from "./UserNav";
import { SidebarLink } from "./SidebarLink";
import { navItems } from "../model/nav-items";
import { useUnreadCounts } from "@/features/stats/unread-counts";

export function ChatSidebar() {
  const { unreadCounts } = useUnreadCounts();
  const location = useLocation();

  const isActive = (url: string) => {
    if (url === "/") return location.pathname === "/";
    return location.pathname.startsWith(url);
  };

  return (
    <div
      className={`
        w-full h-full flex flex-row justify-between items-center px-4 py-0 gap-2
        md:flex-col md:justify-between md:items-center md:px-0 md:py-4 md:gap-4
      `}
    >
      <div
        className={`
          flex items-center gap-4 w-full justify-around
          md:flex-col md:gap-8 md:justify-start
        `}
      >
        <section
          className={`
            hidden md:flex aspect-square size-12 items-center justify-center 
            rounded-xl bg-blue-500 text-gray-50 shrink-0
          `}
        >
          <MessageCircleDashedIcon />
        </section>
        <section
          className={`
            flex flex-row md:flex-col items-center gap-1
            md:gap-3 w-full justify-around md:justify-start
          `}
        >
          {navItems.map((nav) => (
            <SidebarLink
              key={nav.url}
              nav={nav}
              isActive={isActive(nav.url)}
              badgeCount={unreadCounts[nav?.badgeName ?? ""]}
            />
          ))}
        </section>
      </div>
      <div className="flex shrink-0">
        <UserNav />
      </div>
    </div>
  );
}
