import { useSendConnection } from "../model/useSendConnection";

export function SendConnectionButton({
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
      className="bg-blue-500 text-gray-50 text-sm font-medium rounded-lg p-3 cursor-pointer hover:bg-blue-600"
    >
      {text}
    </button>
  );
}
