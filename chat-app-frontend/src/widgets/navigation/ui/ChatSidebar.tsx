import {
  MessageCircleDashedIcon,
  HomeIcon,
  MessageCircleIcon,
  BookUserIcon,
  UsersRoundIcon,
  HandshakeIcon,
  BellIcon,
} from "lucide-react";
import { Link } from "react-router";
import { UserNav } from "./UserNav";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/ui/shadcn/tooltip";

export function ChatSidebar() {
  const navItems = [
    {
      title: "Home",
      url: "/",
      icon: HomeIcon,
      isActive: true,
    },
    {
      title: "Messages",
      url: "/messages",
      icon: MessageCircleIcon,
      isActive: true,
    },
    {
      title: "Contacts",
      url: "/contacts",
      icon: BookUserIcon,
      isActive: false,
    },
    {
      title: "People",
      url: "/people",
      icon: UsersRoundIcon,
      isActive: false,
    },
    {
      title: "Contact Requests",
      url: "/contact-requests",
      icon: HandshakeIcon,
      isActive: false,
    },
    {
      title: "Notifications",
      url: "/notifications",
      icon: BellIcon,
      isActive: false,
    },
  ];

  return (
    <div className="w-full h-full flex flex-col justify-between items-center gap-4 py-4">
      <div className="flex flex-col gap-8">
        <div className="flex aspect-square size-12 items-center justify-center rounded-xl bg-blue-500 text-gray-50">
          <MessageCircleDashedIcon />
        </div>
        <div className="flex flex-col gap-4">
          {navItems.map((nav) => (
            <Tooltip key={nav.title}>
              <TooltipTrigger asChild>
                <Link
                  key={nav.url}
                  to={nav.url}
                  className="flex justify-center items-center"
                >
                  <button className="cursor-pointer">{<nav.icon />}</button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{nav.title}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
      <UserNav />
    </div>
  );
}
