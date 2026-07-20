import { PaperPlaneRightIcon } from "@phosphor-icons/react";

export function EmptyPlaceholder() {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center gap-4 p-6 text-center">
      <PaperPlaneRightIcon
        weight="duotone"
        className="size-14 text-muted-foreground"
      />
      <div className="flex flex-col gap-1">
        <p className="text-lg font-semibold text-foreground">
          No requests sent
        </p>
        <p className="text-sm text-muted-foreground max-w-xs">
          Contact requests you send will appear here while you wait for a reply.
        </p>
      </div>
    </div>
  );
}
