import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/ui/shadcn/tooltip";
import { cn } from "@/shared/lib/utils";
import { Link } from "react-router";
import { motion } from "framer-motion";
import type { NavItem } from "../model/nav.types";
import { Badge } from "@/shared/ui/shadcn/badge";
import { tapScale } from "@/shared/lib/motion";

const MotionLink = motion.create(Link);

export interface SidebarLinkProps {
  nav: NavItem;
  isActive: boolean;
  badgeCount: number;
}

export function SidebarLink({
  nav: { title, url, icon: Icon },
  isActive,
  badgeCount,
}: SidebarLinkProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <MotionLink
          key={url}
          to={url}
          whileTap={tapScale}
          aria-label={badgeCount > 0 ? `${title}, ${badgeCount} unread` : title}
          aria-current={isActive ? "page" : undefined}
          className={cn(
            "relative flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 transition-all duration-200 cursor-pointer",
            "md:size-11 md:gap-0 md:p-0",
            isActive
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <span className="relative">
            <Icon className="size-5 md:size-6" />
            {badgeCount > 0 && (
              <Badge className="border-4 py-2.5 rounded-full border-sidebar bg-red-500 text-gray-50 absolute top-0 inset-e-0 -mt-4 -me-7">
                {badgeCount}
              </Badge>
            )}
          </span>

          {/* Mobile-only label under the icon; desktop uses the tooltip */}
          <span className="text-[10px] font-medium leading-none whitespace-nowrap md:hidden">
            {title}
          </span>
        </MotionLink>
      </TooltipTrigger>
      {/* Tooltip is desktop-only; the mobile bar shows the title under the icon */}
      <TooltipContent side="right" className="hidden md:block">
        <span>{title}</span>
      </TooltipContent>
    </Tooltip>
  );
}
