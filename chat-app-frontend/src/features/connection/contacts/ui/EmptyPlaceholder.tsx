import { FaAddressBook } from "react-icons/fa6";

export function EmptyPlaceholder() {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center gap-4 p-6 text-center">
      <FaAddressBook size={56} className="text-muted-foreground" />
      <div className="flex flex-col gap-1">
        <p className="text-lg font-semibold text-foreground">No contacts yet</p>
        <p className="text-sm text-muted-foreground max-w-xs">
          Find people and send a request to start building your contacts.
        </p>
      </div>
    </div>
  );
}
