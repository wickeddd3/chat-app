import {
  UserCircleIcon,
  BellIcon,
  GearIcon,
  SignOutIcon,
} from "@phosphor-icons/react";
import { Button } from "@/shared/ui/shadcn/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/shadcn/dialog";
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
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open account menu"
          className="rounded-full cursor-pointer"
        >
          <ProfileAvatar imageSrc={authProfile?.image || ""} size={"default"} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm" aria-describedby={undefined}>
        <DialogHeader className="flex-row items-center gap-3 space-y-0">
          <ProfileAvatar imageSrc={authProfile?.image || ""} size={"lg"} />
          <div className="flex flex-col gap-1 text-left min-w-0">
            <DialogTitle className="truncate">
              {authProfile?.name || authProfile?.username || "Account"}
            </DialogTitle>
            {authProfile?.email && (
              <DialogDescription className="truncate">
                {authProfile.email}
              </DialogDescription>
            )}
          </div>
        </DialogHeader>

        <nav className="flex flex-col gap-1">
          <DialogClose asChild>
            <Link
              to={"/profile"}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-muted transition-colors cursor-pointer"
            >
              <UserCircleIcon
                weight="duotone"
                className="size-5 text-muted-foreground"
              />
              Account
            </Link>
          </DialogClose>

          <DialogClose asChild>
            <Link
              to={"/notifications"}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-muted transition-colors cursor-pointer"
            >
              <BellIcon
                weight="duotone"
                className="size-5 text-muted-foreground"
              />
              Notifications
              {unreadNotificationBadge > 0 && (
                <Badge
                  className="ml-auto rounded-full border-popover bg-red-500 text-gray-50"
                  aria-label={`${unreadNotificationBadge} unread notifications`}
                >
                  {unreadNotificationBadge}
                </Badge>
              )}
            </Link>
          </DialogClose>

          <DialogClose asChild>
            <Link
              to={"/settings"}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-muted transition-colors cursor-pointer"
            >
              <GearIcon
                weight="duotone"
                className="size-5 text-muted-foreground"
              />
              Settings
            </Link>
          </DialogClose>

          <div className="my-1 h-px bg-border" />

          <DialogClose asChild>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-muted transition-colors cursor-pointer text-left"
            >
              <SignOutIcon
                weight="duotone"
                className="size-5 text-muted-foreground"
              />
              Sign Out
            </button>
          </DialogClose>
        </nav>
      </DialogContent>
    </Dialog>
  );
}
