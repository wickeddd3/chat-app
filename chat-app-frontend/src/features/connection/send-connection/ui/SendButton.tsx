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
      className="bg-blue-500 text-gray-50 text-xs font-medium rounded-lg px-3 py-2 cursor-pointer hover:bg-blue-600"
      aria-label="Send connection request"
      role="button"
      title="Send connection request"
    >
      {text}
    </button>
  );
}
