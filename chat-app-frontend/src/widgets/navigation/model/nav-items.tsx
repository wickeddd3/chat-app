import {
  HomeIcon,
  MessageCircleIcon,
  BookUserIcon,
  UsersRoundIcon,
  HandshakeIcon,
  BellIcon,
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
    title: "Contact Requests",
    url: "/contact-requests",
    icon: HandshakeIcon,
    badgeName: "pendingRequestsCount",
  },
  {
    title: "Notifications",
    url: "/notifications",
    icon: BellIcon,
    badgeName: "unreadNotificationsCount",
  },
];
