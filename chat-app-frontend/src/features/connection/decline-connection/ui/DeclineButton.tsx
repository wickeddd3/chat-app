import { FaUserXmark } from "react-icons/fa6";
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
    <button
      onClick={() =>
        declineConnectionRequest({
          connectionRequestId,
          connectionRequestUserId,
        })
      }
      className="bg-primary  rounded-lg px-3 py-2 flex items-center justify-center gap-2 cursor-pointer hover:bg-primary/90"
      aria-label="Decline connection request"
      role="button"
      title="Decline connection request"
    >
      <FaUserXmark size={18} className="text-gray-50" />
      <span className="text-xs font-medium text-gray-50 hidden sm:inline-block">
        {text}
      </span>
    </button>
  );
}
