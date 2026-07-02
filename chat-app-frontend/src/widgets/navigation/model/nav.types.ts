import type { ComponentType } from "react";

export interface NavItem {
  title: string;
  url: string;
  icon: ComponentType<{ className?: string }>;
  badgeName?: string;
}
