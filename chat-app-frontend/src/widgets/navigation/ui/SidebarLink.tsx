import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/ui/shadcn/tooltip";
import { cn } from "@/shared/lib/utils";
import { Link } from "react-router";
import type { NavItem } from "../model/nav.types";
import { Badge } from "@/shared/ui/shadcn/badge";

export function SidebarLink({
  nav: { title, url, icon: Icon },
  isActive,
  badgeCount,
}: {
  nav: NavItem;
  isActive: boolean;
  badgeCount: number;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          key={url}
          to={url}
          aria-label={badgeCount > 0 ? `${title}, ${badgeCount} unread` : title}
          aria-current={isActive ? "page" : undefined}
          className={cn(
            "relative flex justify-center items-center text-gray-600 p-2 rounded-lg transition-colors duration-200 cursor-pointer",
            isActive && "bg-gray-200 text-gray-900",
          )}
        >
          <Icon />
          {badgeCount > 0 && (
            <Badge className="border-4 py-2.5 rounded-full border-white bg-red-500 text-gray-50 absolute top-0 inset-e-0 -mt-2 -me-3">
              {badgeCount}
            </Badge>
          )}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">
        <span>{title}</span>
      </TooltipContent>
    </Tooltip>
  );
}
