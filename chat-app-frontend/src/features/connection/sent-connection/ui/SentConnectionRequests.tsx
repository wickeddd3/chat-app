import { ConnectionItem } from "@/entities/connection";
import { useSentConnectionRequests } from "../model/useSentConnectionRequests";

export function SentConnectionRequests() {
  const { sentRequests } = useSentConnectionRequests();

  return (
    <>
      {sentRequests.map((request) => (
        <ConnectionItem key={request.id} user={request.user} />
      ))}
    </>
  );
}
