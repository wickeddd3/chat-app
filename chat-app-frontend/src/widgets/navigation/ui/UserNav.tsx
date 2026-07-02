import {
  CircleUserRoundIcon,
  BellIcon,
  CogIcon,
  LogOutIcon,
} from "lucide-react";
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
          className="rounded-full cursor-pointer"
        >
          <ProfileAvatar imageSrc={authProfile?.image || ""} size={"default"} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8} className="w-44">
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link to={"/profile"}>
              <CircleUserRoundIcon />
              Account
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="cursor-pointer">
            <Link to={"/notifications"}>
              <BellIcon />
              Notifications
              {unreadNotificationBadge > 0 && (
                <Badge className="rounded-full border-white bg-red-500 text-gray-50">
                  {unreadNotificationBadge}
                </Badge>
              )}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <CogIcon />
            Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={logout}>
          <LogOutIcon />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
