import { AddressBookIcon } from "@phosphor-icons/react";
import { NoSearchResults } from "@/shared/ui/NoSearchResults";

export interface EmptyPlaceholderProps {
  /** The active search, if the list is empty because of one. */
  searchQuery?: string;
}

export function EmptyPlaceholder({ searchQuery }: EmptyPlaceholderProps) {
  if (searchQuery) {
    return <NoSearchResults query={searchQuery} noun="contacts" />;
  }

  return (
    <div className="w-full h-full flex flex-col justify-center items-center gap-4 p-6 text-center">
      <AddressBookIcon
        weight="duotone"
        className="size-14 text-muted-foreground"
      />
      <div className="flex flex-col gap-1">
        <p className="text-lg font-semibold text-foreground">No contacts yet</p>
        <p className="text-sm text-muted-foreground max-w-xs">
          Find people and send a request to start building your contacts.
        </p>
      </div>
    </div>
  );
}
