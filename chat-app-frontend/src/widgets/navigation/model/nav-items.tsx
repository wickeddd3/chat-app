import {
  FaHouse,
  FaComments,
  FaAddressBook,
  FaUsers,
  FaHandshake,
} from "react-icons/fa6";
import type { NavItem } from "./nav.types";

export const navItems: NavItem[] = [
  {
    title: "Home",
    url: "/",
    icon: FaHouse,
  },
  {
    title: "Messages",
    url: "/messages",
    icon: FaComments,
    badgeName: "unreadMessagesCount",
  },
  {
    title: "Contacts",
    url: "/contacts",
    icon: FaAddressBook,
  },
  {
    title: "People",
    url: "/people",
    icon: FaUsers,
  },
  {
    title: "Requests",
    url: "/contact-requests",
    icon: FaHandshake,
    badgeName: "pendingRequestsCount",
  },
];
