import { UserPlusIcon } from "@phosphor-icons/react";
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
    <button
      onClick={() => sendConnectionRequest({ receiverId })}
      className="bg-primary  rounded-lg px-3 py-2 flex items-center justify-center gap-2 cursor-pointer hover:bg-primary/90"
      aria-label="Send connection request"
      role="button"
      title="Send connection request"
    >
      <UserPlusIcon className="size-4 text-gray-50" />
      <span className="text-xs font-medium text-gray-50 hidden sm:inline-block">
        {text}
      </span>
    </button>
  );
}
