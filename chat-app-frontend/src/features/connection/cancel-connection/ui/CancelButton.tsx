import { UserRoundMinusIcon } from "lucide-react";
import { useCancelConnection } from "../model/useCancelConnection";
import { useAuth } from "@/app/store/AuthContext";

export function CancelButton({
  text,
  connectionRequestId,
  connectionRequestUserId,
}: {
  text: string;
  connectionRequestId: string;
  connectionRequestUserId: string;
}) {
  const { authUser } = useAuth();
  const { cancelConnectionRequest } = useCancelConnection(authUser?.id);

  return (
    <button
      onClick={() =>
        cancelConnectionRequest({
          connectionRequestId,
          connectionRequestUserId,
        })
      }
      className="bg-blue-500  rounded-lg px-3 py-2 flex items-center justify-center gap-2 cursor-pointer hover:bg-blue-600"
      aria-label="Cancel connection request"
      role="button"
      title="Cancel connection request"
    >
      <UserRoundMinusIcon size={18} className="text-gray-50" />
      <span className="text-xs font-medium text-gray-50 hidden sm:inline-block">
        {text}
      </span>
    </button>
  );
}
