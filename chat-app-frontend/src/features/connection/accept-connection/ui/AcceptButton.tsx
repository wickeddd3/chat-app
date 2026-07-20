import { UserCheckIcon } from "@phosphor-icons/react";
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
    <button
      onClick={() => acceptConnectionRequest(connectionRequestId)}
      className="bg-primary  rounded-lg px-3 py-2 flex items-center justify-center gap-2 cursor-pointer hover:bg-primary/90"
      aria-label="Accept connection request"
      role="button"
      title="Accept connection request"
    >
      <UserCheckIcon className="size-4 text-gray-50" />
      <span className="text-xs font-medium text-gray-50 hidden sm:inline-block">
        {text}
      </span>
    </button>
  );
}
