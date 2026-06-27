import { UserRoundPlusIcon } from "lucide-react";
import { useSendConnection } from "../model/useSendConnection";

export function SendButton({
  text,
  receiverId,
}: {
  text: string;
  receiverId: string;
}) {
  const { sendConnectionRequest } = useSendConnection();

  return (
    <button
      onClick={() => sendConnectionRequest({ receiverId })}
      className="bg-blue-500  rounded-lg px-3 py-2 flex items-center justify-center gap-2 cursor-pointer hover:bg-blue-600"
      aria-label="Send connection request"
      role="button"
      title="Send connection request"
    >
      <UserRoundPlusIcon size={18} className="text-gray-50" />
      <span className="text-xs font-medium text-gray-50 hidden sm:inline-block">
        {text}
      </span>
    </button>
  );
}
