import { useAcceptConnection } from "../model/useAcceptConnection";

export function AcceptButton({
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
      className="bg-blue-500 text-gray-50 text-xs font-medium rounded-lg px-3 py-2 cursor-pointer hover:bg-blue-600"
      aria-label="Accept connection request"
      role="button"
      title="Accept connection request"
    >
      {text}
    </button>
  );
}
