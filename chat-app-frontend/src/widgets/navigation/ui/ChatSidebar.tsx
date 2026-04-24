import {
  CircleUser,
  MessageCircle,
  MessageCircleDashed,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router";

export function ChatSidebar() {
  const navItems = [
    {
      title: "Messages",
      url: "/messages",
      icon: MessageCircle,
      isActive: true,
    },
    {
      title: "People",
      url: "/people",
      icon: UsersRound,
      isActive: false,
    },
  ];

  return (
    <div className="w-full h-full flex flex-col justify-between items-center gap-4 py-4">
      <div className="flex flex-col gap-8">
        <div className="flex aspect-square size-12 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
          <MessageCircleDashed />
        </div>
        <div className="flex flex-col gap-4">
          {navItems.map((nav) => (
            <Link to={nav.url} className="flex justify-center items-center">
              <button className="cursor-pointer">{<nav.icon />}</button>
            </Link>
          ))}
        </div>
      </div>
      <div className="flex aspect-square size-12 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground">
        <button className="cursor-pointer">
          <CircleUser />
        </button>
      </div>
    </div>
  );
}
