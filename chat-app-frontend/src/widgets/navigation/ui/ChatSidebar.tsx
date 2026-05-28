import { MessageCircleDashedIcon } from "lucide-react";
import { useLocation } from "react-router";
import { UserNav } from "./UserNav";
import { SidebarLink } from "./SidebarLink";
import { navItems } from "../model/nav-items";

export function ChatSidebar() {
  const isActive = (url: string) => {
    const location = useLocation();
    return location.pathname === url;
  };

  return (
    <div className="w-full h-full flex flex-col justify-between items-center gap-4 py-4">
      <div className="flex flex-col gap-8">
        <section className="flex aspect-square size-12 items-center justify-center rounded-xl bg-blue-500 text-gray-50">
          <MessageCircleDashedIcon />
        </section>
        <section className="flex flex-col">
          {navItems.map((nav) => (
            <SidebarLink key={nav.url} nav={nav} isActive={isActive(nav.url)} />
          ))}
        </section>
      </div>
      <UserNav />
    </div>
  );
}
