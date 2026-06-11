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
import { ProfileAvatar } from "@/shared/ui/ProfileAvatar";
import { useAuth } from "@/app/store/AuthContext";

export function UserNav() {
  const { authProfile } = useAuth();
  const { logout } = useSignOut();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full cursor-pointer"
        >
          <ProfileAvatar imageSrc={authProfile?.image || ""} />
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
