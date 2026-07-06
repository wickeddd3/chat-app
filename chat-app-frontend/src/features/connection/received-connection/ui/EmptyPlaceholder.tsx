import { FaRegEnvelopeOpen } from "react-icons/fa6";

export function EmptyPlaceholder() {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center gap-4 p-6 text-center">
      <FaRegEnvelopeOpen size={56} className="text-muted-foreground" />
      <div className="flex flex-col gap-1">
        <p className="text-lg font-semibold text-foreground">
          No requests received
        </p>
        <p className="text-sm text-muted-foreground max-w-xs">
          Contact requests people send you will appear here.
        </p>
      </div>
    </div>
  );
}
