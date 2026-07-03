import { FaCircleUser, FaBell, FaGear, FaRightFromBracket } from "react-icons/fa6";
import { Button } from "@/shared/ui/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/shadcn/dropdown-menu";
import { Link } from "react-router";
import { useSignOut } from "@/features/auth/sign-out";
import { ProfileAvatar } from "@/shared/ui/ProfileAvatar";
import { useAuthProfile } from "@/entities/auth";
import { useUnreadCounts } from "@/features/stats/unread-counts";
import { Badge } from "@/shared/ui/shadcn/badge";
import { useAuth } from "@/entities/auth";

export function UserNav() {
  const { authUser } = useAuth();
  const { authProfile } = useAuthProfile(authUser?.id);
  const { logout } = useSignOut();
  const { unreadCounts } = useUnreadCounts(authUser?.id);

  const unreadNotificationBadge = unreadCounts["unreadNotificationsCount"];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open account menu"
          className="rounded-full cursor-pointer"
        >
          <ProfileAvatar imageSrc={authProfile?.image || ""} size={"default"} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8} className="w-44">
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link to={"/profile"}>
              <FaCircleUser />
              Account
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="cursor-pointer">
            <Link to={"/notifications"}>
              <FaBell />
              Notifications
              {unreadNotificationBadge > 0 && (
                <Badge
                  className="rounded-full border-white bg-red-500 text-gray-50"
                  aria-label={`${unreadNotificationBadge} unread notifications`}
                >
                  {unreadNotificationBadge}
                </Badge>
              )}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link to={"/settings"}>
              <FaGear />
              Settings
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={logout}>
          <FaRightFromBracket />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
