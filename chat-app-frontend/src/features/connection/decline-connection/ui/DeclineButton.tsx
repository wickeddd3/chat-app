import { UserMinusIcon } from "@phosphor-icons/react";
import { Button } from "@/shared/ui/shadcn/button";
import { useDeclineConnection } from "../model/useDeclineConnection";
import { useAuth } from "@/entities/auth";

export interface DeclineButtonProps {
  text: string;
  connectionRequestId: string;
  connectionRequestUserId: string;
}

export function DeclineButton({
  text,
  connectionRequestId,
  connectionRequestUserId,
}: DeclineButtonProps) {
  const { authUser } = useAuth();
  const { declineConnectionRequest } = useDeclineConnection(authUser?.id);

  return (
    <Button
      onClick={() =>
        declineConnectionRequest({
          connectionRequestId,
          connectionRequestUserId,
        })
      }
      variant="outline"
      size="sm"
      className="cursor-pointer gap-2"
      aria-label="Decline connection request"
      title="Decline connection request"
    >
      <UserMinusIcon className="size-4" />
      <span className="hidden sm:inline-block">{text}</span>
    </Button>
  );
}
