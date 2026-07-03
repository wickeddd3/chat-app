import { FaCommentDots } from "react-icons/fa6";
import { useLocation } from "react-router";
import { UserNav } from "./UserNav";
import { SidebarLink } from "./SidebarLink";
import { navItems } from "../model/nav-items";
import { useUnreadCounts } from "@/features/stats/unread-counts";
import { Badge } from "@/shared/ui/shadcn/badge";
import { useAuth } from "@/entities/auth";

export function ChatSidebar() {
  const { authUser } = useAuth();
  const { unreadCounts } = useUnreadCounts(authUser?.id);
  const location = useLocation();

  const isActive = (url: string) => {
    if (url === "/") return location.pathname === "/";
    return location.pathname.startsWith(url);
  };

  const unreadNotificationBadge = unreadCounts["unreadNotificationsCount"];

  return (
    <div
      className={`
        w-full h-full flex flex-row justify-between items-center px-4 py-0 gap-5
        md:flex-col md:justify-between md:items-center md:px-0 md:py-4 md:gap-3
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
            rounded-2xl bg-linear-to-br from-primary to-primary text-gray-50
            shadow-lg shadow-primary/30 shrink-0
          `}
        >
          <FaCommentDots className="size-6" />
        </section>
        <nav
          aria-label="Primary"
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
              badgeCount={unreadCounts[nav?.badgeName ?? ""] ?? 0}
            />
          ))}
        </nav>
      </div>
      <div className="relative flex shrink-0 mr-4 md:mr-0">
        <UserNav />
        {unreadNotificationBadge > 0 && (
          <Badge className="border-4 py-2.5 rounded-full border-sidebar bg-red-500 text-gray-50 absolute top-0 inset-e-0 -mt-4 -me-4">
            {unreadNotificationBadge}
          </Badge>
        )}
      </div>
    </div>
  );
}
