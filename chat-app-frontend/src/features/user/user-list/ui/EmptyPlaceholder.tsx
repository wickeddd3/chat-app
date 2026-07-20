import { UsersThreeIcon } from "@phosphor-icons/react";
import { NoSearchResults } from "@/shared/ui/NoSearchResults";

export interface EmptyPlaceholderProps {
  /** The active search, if the list is empty because of one. */
  searchQuery?: string;
}

export function EmptyPlaceholder({ searchQuery }: EmptyPlaceholderProps) {
  if (searchQuery) {
    return <NoSearchResults query={searchQuery} noun="people" />;
  }

  return (
    <div className="w-full h-full flex flex-col justify-center items-center gap-4 p-6 text-center">
      <UsersThreeIcon
        weight="duotone"
        className="size-14 text-muted-foreground"
      />
      <div className="flex flex-col gap-1">
        <p className="text-lg font-semibold text-foreground">
          No one to show yet
        </p>
        <p className="text-sm text-muted-foreground max-w-xs">
          Check back later as more people join.
        </p>
      </div>
    </div>
  );
}
