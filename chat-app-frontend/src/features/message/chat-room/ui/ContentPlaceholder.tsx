import { ChatsIcon } from "@phosphor-icons/react";

export function ContentPlaceholder() {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center gap-4 p-6 text-center">
      <ChatsIcon weight="duotone" className="size-14 text-muted-foreground" />
      <div className="flex flex-col gap-1">
        <p className="text-lg font-semibold text-foreground">
          No conversation selected
        </p>
        <p className="text-sm text-muted-foreground max-w-xs">
          Pick a conversation from your inbox to start chatting.
        </p>
      </div>
    </div>
  );
}
