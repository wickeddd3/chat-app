import { UserRoundXIcon } from "lucide-react";
import { useDeclineConnection } from "../model/useDeclineConnection";

export function DeclineButton({
  text,
  connectionRequestId,
  connectionRequestUserId,
}: {
  text: string;
  connectionRequestId: string;
  connectionRequestUserId: string;
}) {
  const { declineConnectionRequest } = useDeclineConnection();

  return (
    <button
      onClick={() =>
        declineConnectionRequest({
          connectionRequestId,
          connectionRequestUserId,
        })
      }
      className="bg-blue-500  rounded-lg px-3 py-2 flex items-center justify-center gap-2 cursor-pointer hover:bg-blue-600"
      aria-label="Decline connection request"
      role="button"
      title="Decline connection request"
    >
      <UserRoundXIcon size={18} className="text-gray-50" />
      <span className="text-xs font-medium text-gray-50 hidden sm:inline-block">
        {text}
      </span>
    </button>
  );
}
