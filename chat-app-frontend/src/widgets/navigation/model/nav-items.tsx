import {
  ChatsCircleIcon,
  AddressBookIcon,
  UsersIcon,
  HandshakeIcon,
} from "@phosphor-icons/react";
import type { NavItem } from "./nav.types";

export const navItems: NavItem[] = [
  {
    title: "Messages",
    url: "/messages",
    icon: ChatsCircleIcon,
    badgeName: "unreadMessagesCount",
  },
  {
    title: "Contacts",
    url: "/contacts",
    icon: AddressBookIcon,
  },
  {
    title: "People",
    url: "/people",
    icon: UsersIcon,
  },
  {
    title: "Requests",
    url: "/contact-requests",
    icon: HandshakeIcon,
    badgeName: "pendingRequestsCount",
  },
];
