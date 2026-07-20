import { UsersThreeIcon } from "@phosphor-icons/react";

export function EmptyPlaceholder() {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center gap-4 p-6 text-center">
      <UsersThreeIcon
        weight="duotone"
        className="size-14 text-muted-foreground"
      />
      <div className="flex flex-col gap-1">
        <p className="text-lg font-semibold text-foreground">No people found</p>
        <p className="text-sm text-muted-foreground max-w-xs">
          Try a different name, or check back later as more people join.
        </p>
      </div>
    </div>
  );
}
