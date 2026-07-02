import { FaUserCheck } from "react-icons/fa6";
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
      className="bg-blue-500  rounded-lg px-3 py-2 flex items-center justify-center gap-2 cursor-pointer hover:bg-blue-600"
      aria-label="Accept connection request"
      role="button"
      title="Accept connection request"
    >
      <FaUserCheck size={18} className="text-gray-50" />
      <span className="text-xs font-medium text-gray-50 hidden sm:inline-block">
        {text}
      </span>
    </button>
  );
}
