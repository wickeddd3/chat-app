import { useDeclineConnection } from "../model/useDeclineConnection";

export function DeclineButton({
  text,
  connectionRequestId,
}: {
  text: string;
  connectionRequestId: string;
}) {
  const { declineConnectionRequest } = useDeclineConnection();

  return (
    <button
      onClick={() => declineConnectionRequest(connectionRequestId)}
      className="bg-blue-500 text-gray-50 text-xs font-medium rounded-lg px-3 py-2 cursor-pointer hover:bg-blue-600"
      aria-label="Decline connection request"
      role="button"
      title="Decline connection request"
    >
      {text}
    </button>
  );
}
