import { ContactList } from "@/features/connection/contacts";

export default function ConnectionsPage() {
  return (
    <div className="flex-1 flex flex-col max-h-full border-r">
      <div className="flex justify-between items-center p-4">
        <h1 className="text-base font-medium text-foreground">Contacts</h1>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <ContactList />
      </div>
    </div>
  );
}
