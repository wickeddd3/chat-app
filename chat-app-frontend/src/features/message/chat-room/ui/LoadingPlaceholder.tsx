import { Skeleton } from "@/shared/ui/shadcn/skeleton";
import { cn } from "@/shared/lib/utils";

// Mirrors the MessageBubble layout (avatar + bubble, alternating sides) so the
// chat viewport shows a message-shaped skeleton while history loads.
const bubbles = [
  { mine: false, width: "w-40" },
  { mine: true, width: "w-52" },
  { mine: false, width: "w-32" },
  { mine: true, width: "w-44" },
  { mine: false, width: "w-56" },
  { mine: true, width: "w-36" },
];

export function LoadingPlaceholder() {
  return (
    <div
      role="status"
      aria-label="Loading messages"
      className="w-full h-full flex flex-col gap-4 px-4 py-4 overflow-hidden"
    >
      {bubbles.map(({ mine, width }, index) => (
        <div
          key={index}
          className={cn(
            "flex items-start gap-2",
            mine ? "flex-row-reverse" : "flex-row",
          )}
        >
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <Skeleton className={cn("h-12 rounded-lg", width)} />
        </div>
      ))}
    </div>
  );
}
