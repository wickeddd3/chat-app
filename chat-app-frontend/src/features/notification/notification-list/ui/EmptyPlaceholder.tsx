import { FaRegBell } from "react-icons/fa6";

export function EmptyPlaceholder() {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center gap-4 p-6 text-center">
      <FaRegBell size={56} className="text-muted-foreground" />
      <div className="flex flex-col gap-1">
        <p className="text-lg font-semibold text-foreground">
          You're all caught up
        </p>
        <p className="text-sm text-muted-foreground max-w-xs">
          New notifications will show up here as they arrive.
        </p>
      </div>
    </div>
  );
}
