import {
  HomeIcon,
  MessageCircleIcon,
  BookUserIcon,
  UsersRoundIcon,
  HandshakeIcon,
} from "lucide-react";
import type { NavItem } from "./nav.types";

export const navItems: NavItem[] = [
  {
    title: "Home",
    url: "/",
    icon: HomeIcon,
  },
  {
    title: "Messages",
    url: "/messages",
    icon: MessageCircleIcon,
    badgeName: "unreadMessagesCount",
  },
  {
    title: "Contacts",
    url: "/contacts",
    icon: BookUserIcon,
  },
  {
    title: "People",
    url: "/people",
    icon: UsersRoundIcon,
  },
  {
    title: "Connection Requests",
    url: "/contact-requests",
    icon: HandshakeIcon,
    badgeName: "pendingRequestsCount",
  },
];
