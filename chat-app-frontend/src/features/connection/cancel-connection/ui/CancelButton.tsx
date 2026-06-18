import { useCancelConnection } from "../model/useCancelConnection";

export function CancelButton({
  text,
  connectionRequestId,
  connectionRequestUserId,
}: {
  text: string;
  connectionRequestId: string;
  connectionRequestUserId: string;
}) {
  const { cancelConnectionRequest } = useCancelConnection();

  return (
    <button
      onClick={() =>
        cancelConnectionRequest({
          connectionRequestId,
          connectionRequestUserId,
        })
      }
      className="bg-blue-500 text-gray-50 text-xs font-medium rounded-lg px-3 py-2 cursor-pointer hover:bg-blue-600"
      aria-label="Cancel connection request"
      role="button"
      title="Cancel connection request"
    >
      {text}
    </button>
  );
}
