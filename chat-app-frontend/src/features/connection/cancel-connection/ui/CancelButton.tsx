import { XCircleIcon } from "@phosphor-icons/react";
import { Button } from "@/shared/ui/shadcn/button";
import { useCancelConnection } from "../model/useCancelConnection";
import { useAuth } from "@/entities/auth";

export interface CancelButtonProps {
  text: string;
  connectionRequestId: string;
  connectionRequestUserId: string;
}

export function CancelButton({
  text,
  connectionRequestId,
  connectionRequestUserId,
}: CancelButtonProps) {
  const { authUser } = useAuth();
  const { cancelConnectionRequest } = useCancelConnection(authUser?.id);

  return (
    <Button
      onClick={() =>
        cancelConnectionRequest({
          connectionRequestId,
          connectionRequestUserId,
        })
      }
      variant="outline"
      size="sm"
      className="cursor-pointer gap-2"
      aria-label="Cancel connection request"
      title="Cancel connection request"
    >
      <XCircleIcon className="size-4" />
      <span className="hidden sm:inline-block">{text}</span>
    </Button>
  );
}
