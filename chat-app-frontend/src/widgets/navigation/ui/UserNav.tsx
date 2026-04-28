import { BadgeCheckIcon, BellIcon, CogIcon, LogOutIcon } from "lucide-react";
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
import { useAuth } from "@/entities/auth";
import { UserAvatar } from "@/entities/user";

export function UserNav() {
  const { authUser } = useAuth();
  const { logout } = useSignOut();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full cursor-pointer"
        >
          <UserAvatar imageSrc={authUser?.image || ""} size="lg" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8} className="w-40">
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link to={"/profile"}>
              <BadgeCheckIcon />
              Account
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem disabled>
            <BellIcon />
            Notifications
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
