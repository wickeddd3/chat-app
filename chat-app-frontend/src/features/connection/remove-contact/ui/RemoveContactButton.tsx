import { UserMinusIcon } from "@phosphor-icons/react";
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
import { useRemoveContact } from "../model/useRemoveContact";

export interface RemoveContactButtonProps {
  targetUserId: string;
  /** Named in the confirmation copy so the user can see who they are removing. */
  targetName?: string;
  /**
   * `compact` is the icon-only control for a dense contacts row; `full` is the
   * labelled, full-width control the channel drawer shows.
   */
  layout?: "compact" | "full";
}

export function RemoveContactButton({
  targetUserId,
  targetName,
  layout = "compact",
}: RemoveContactButtonProps) {
  const { authUser } = useAuth();
  const { removeContact, isPending } = useRemoveContact(authUser?.id);

  const label = "Remove contact";
  const who = targetName ?? "this contact";
  // Row-specific, so a list of contacts doesn't present a dozen buttons that all
  // announce the same name (and so the confirm action stays distinguishable).
  const triggerLabel = targetName ? `Remove ${targetName}` : label;

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          aria-label={triggerLabel}
          title={triggerLabel}
          className={`cursor-pointer gap-2 text-destructive hover:text-destructive ${
            layout === "full" ? "w-full" : ""
          }`}
        >
          <UserMinusIcon className="size-4" />
          {layout === "full" ? (
            <span>{label}</span>
          ) : (
            <span className="hidden sm:inline-block">Remove</span>
          )}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {who}?</AlertDialogTitle>
          <AlertDialogDescription>
            You will no longer be able to message each other. Your conversation
            history is kept, and you can send a new connection request later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="cursor-pointer">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            className="cursor-pointer"
            onClick={() =>
              removeContact({
                contactUserId: targetUserId,
                contactName: targetName,
              })
            }
          >
            {label}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
