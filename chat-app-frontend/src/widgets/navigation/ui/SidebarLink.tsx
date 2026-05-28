import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/ui/shadcn/tooltip";
import { cn } from "@/shared/lib/utils";
import { Link } from "react-router";
import type { NavItem } from "../model/nav.types";

export function SidebarLink({
  nav: { title, url, icon: Icon },
  isActive,
}: {
  nav: NavItem;
  isActive: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          key={url}
          to={url}
          className={cn(
            "flex justify-center items-center px-2 py-3 rounded-xl transition-colors duration-200",
            isActive && "bg-gray-200 text-blue-500",
          )}
        >
          <button className="cursor-pointer">
            <Icon />
          </button>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">
        <span>{title}</span>
      </TooltipContent>
    </Tooltip>
  );
}
