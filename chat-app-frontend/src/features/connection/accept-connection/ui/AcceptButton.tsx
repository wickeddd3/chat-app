import { UserCheckIcon } from "@phosphor-icons/react";
import { Button } from "@/shared/ui/shadcn/button";
import { useAcceptConnection } from "../model/useAcceptConnection";
import { useAuth } from "@/entities/auth";

export interface AcceptButtonProps {
  text: string;
  connectionRequestId: string;
}

export function AcceptButton({ text, connectionRequestId }: AcceptButtonProps) {
  const { authUser } = useAuth();
  const { acceptConnectionRequest } = useAcceptConnection(authUser?.id);

  return (
    <Button
      onClick={() => acceptConnectionRequest(connectionRequestId)}
      variant="default"
      size="sm"
      className="cursor-pointer gap-2"
      aria-label="Accept connection request"
      title="Accept connection request"
    >
      <UserCheckIcon className="size-4" />
      <span className="hidden sm:inline-block">{text}</span>
    </Button>
  );
}
