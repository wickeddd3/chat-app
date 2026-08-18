import { SignOutIcon } from "@phosphor-icons/react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/shadcn/alert-dialog";
import { Button } from "@/shared/ui/shadcn/button";
import { useAuth } from "@/entities/auth";
import { useLeaveGroupChannel } from "../model/useLeaveGroupChannel";

export interface LeaveGroupButtonProps {
  channelId: string;
  channelName?: string;
  /** True when the viewer is this group's only remaining member. */
  isLastMember?: boolean;
  /** True when the viewer is its only admin and others would remain. */
  isSoleAdmin?: boolean;
}

export function LeaveGroupButton({
  channelId,
  channelName,
  isLastMember = false,
  isSoleAdmin = false,
}: LeaveGroupButtonProps) {
  const { authUser } = useAuth();
  // Leaving is offered from inside the room, so the user must be moved out of it.
  const { leaveGroupChannel, isPending } = useLeaveGroupChannel(authUser?.id, {
    redirectOnSuccess: true,
  });

  const label = "Leave group";

  // Say what actually happens next, since the three outcomes differ sharply.
  const consequence = isLastMember
    ? "You are the last member, so the group and its entire message history will be deleted. This cannot be undone."
    : isSoleAdmin
      ? "You will lose access to this conversation, and the longest-standing remaining member becomes the group's admin."
      : "You will lose access to this conversation and its history. An admin can add you back later.";

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          aria-label={label}
          title={label}
          className="w-full cursor-pointer gap-2 text-destructive hover:text-destructive"
        >
          <SignOutIcon className="size-4" />
          <span>{label}</span>
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Leave {channelName ?? "this group"}?
          </AlertDialogTitle>
          <AlertDialogDescription>{consequence}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="cursor-pointer">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            className="cursor-pointer"
            onClick={() => leaveGroupChannel({ channelId, channelName })}
          >
            {isLastMember ? "Delete group" : label}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
