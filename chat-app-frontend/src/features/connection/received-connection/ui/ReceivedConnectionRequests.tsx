import { ConnectionItem } from "@/entities/connection";
import { useReceivedConnectionRequests } from "../model/useReceivedConnectionRequests";

export function ReceivedConnectionRequests({
  acceptButton: AcceptButton,
}: {
  acceptButton: React.ComponentType<{
    text: string;
    connectionRequestId: string;
  }>;
}) {
  const { receivedRequests } = useReceivedConnectionRequests();

  return (
    <>
      {receivedRequests.map((request) => (
        <ConnectionItem
          key={request.id}
          user={request.user}
          optionSlot={
            <AcceptButton text="Accept" connectionRequestId={request.id} />
          }
        />
      ))}
    </>
  );
}
