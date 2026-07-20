import type { Icon } from "@phosphor-icons/react";

export interface NavItem {
  title: string;
  url: string;
  icon: Icon;
  badgeName?: string;
}
