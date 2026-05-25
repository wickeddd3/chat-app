import { ConnectionItem } from "@/entities/connection";
import { useContacts } from "../model/useContacts";

export function ContactList() {
  const { contacts } = useContacts();

  return (
    <>
      {contacts.map((contact) => (
        <ConnectionItem
          key={contact.id}
          user={{ name: contact.name, image: contact.image }}
        />
      ))}
    </>
  );
}
