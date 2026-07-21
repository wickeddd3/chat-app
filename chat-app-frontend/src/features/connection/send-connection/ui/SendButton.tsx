import { UserPlusIcon } from "@phosphor-icons/react";
import { Button } from "@/shared/ui/shadcn/button";
import { useSendConnection } from "../model/useSendConnection";
import { useAuth } from "@/entities/auth";

export interface SendButtonProps {
  text: string;
  receiverId: string;
}

export function SendButton({ text, receiverId }: SendButtonProps) {
  const { authUser } = useAuth();
  const { sendConnectionRequest } = useSendConnection(authUser?.id);

  return (
    <Button
      onClick={() => sendConnectionRequest({ receiverId })}
      variant="default"
      size="sm"
      className="cursor-pointer gap-2"
      aria-label="Send connection request"
      title="Send connection request"
    >
      <UserPlusIcon className="size-4" />
      <span className="hidden sm:inline-block">{text}</span>
    </Button>
  );
}
