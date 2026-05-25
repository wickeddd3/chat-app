import { useAcceptConnection } from "../model/useAcceptConnection";

export function AcceptConnectionButton({
  text,
  connectionRequestId,
}: {
  text: string;
  connectionRequestId: string;
}) {
  const { acceptConnectionRequest } = useAcceptConnection();

  return (
    <button
      onClick={() => acceptConnectionRequest(connectionRequestId)}
      className="bg-blue-500 text-gray-50 text-sm font-medium rounded-lg p-3 cursor-pointer hover:bg-blue-600"
    >
      {text}
    </button>
  );
}
