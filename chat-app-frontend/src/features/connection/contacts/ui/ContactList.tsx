import { ConnectionItem } from "@/entities/connection";
import { useContacts } from "../model/useContacts";

export function ContactList({
  messageButton: MessageButton,
}: {
  messageButton: React.ComponentType<{
    text: string;
    targetUserId: string;
  }>;
}) {
  const { contacts } = useContacts();

  return (
    <>
      {contacts.map((contact) => (
        <ConnectionItem
          key={contact.id}
          user={{ name: contact.name, image: contact.image }}
          optionSlot={
            <MessageButton text="Message" targetUserId={contact.id} />
          }
        />
      ))}
    </>
  );
}
