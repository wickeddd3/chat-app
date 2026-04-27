import { BadgeCheckIcon, BellIcon, CogIcon, LogOutIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/shadcn/avatar";
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

export function UserNav() {
  const { logout } = useSignOut();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full cursor-pointer"
        >
          <Avatar size="lg">
            <AvatarImage src="https://github.com/shadcn.png" alt="shadcn" />
            <AvatarFallback>LR</AvatarFallback>
          </Avatar>
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
