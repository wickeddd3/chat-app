import { Skeleton } from "@/shared/ui/shadcn/skeleton";
import { cn } from "@/shared/lib/utils";

// Mirrors the MessageBubble layout so the chat viewport shows a message-shaped
// skeleton while history loads: incoming rows carry a 24px avatar on the run's
// first bubble, own rows reserve that space with none, runs breathe with the
// same pt-3.5 / pt-0.75 rhythm, and each run closes on a timestamp line.
interface SkeletonBubble {
  mine: boolean;
  opensRun: boolean;
  closesRun: boolean;
  /** Bubble width + height, standing in for varied one/two/three-line copy. */
  width: string;
  height: string;
}

const bubbles: SkeletonBubble[] = [
  // Incoming run of two.
  {
    mine: false,
    opensRun: true,
    closesRun: false,
    width: "w-40",
    height: "h-9",
  },
  {
    mine: false,
    opensRun: false,
    closesRun: true,
    width: "w-28",
    height: "h-9",
  },
  // Own, on its own.
  {
    mine: true,
    opensRun: true,
    closesRun: true,
    width: "w-52",
    height: "h-12",
  },
  // Incoming, on its own.
  {
    mine: false,
    opensRun: true,
    closesRun: true,
    width: "w-36",
    height: "h-9",
  },
  // Own run of two.
  {
    mine: true,
    opensRun: true,
    closesRun: false,
    width: "w-44",
    height: "h-9",
  },
  {
    mine: true,
    opensRun: false,
    closesRun: true,
    width: "w-24",
    height: "h-9",
  },
  // Incoming, a longer one.
  {
    mine: false,
    opensRun: true,
    closesRun: true,
    width: "w-56",
    height: "h-16",
  },
];

export function LoadingPlaceholder() {
  return (
    <div
      role="status"
      aria-label="Loading messages"
      // Anchored to the bottom like the real timeline, so the newest bubbles sit
      // by the composer and any overflow is clipped off the top as history would.
      className="w-full h-full flex flex-col justify-end overflow-hidden pb-2"
    >
      {bubbles.map(({ mine, opensRun, closesRun, width, height }, index) => (
        <div
          key={index}
          className={cn(
            "flex w-full min-w-0 gap-2 px-4",
            mine && "flex-row-reverse",
            opensRun ? "pt-3.5" : "pt-0.75",
          )}
        >
          {/* Reserved either way so both sides share one edge; the avatar rides
              only the top of an incoming run. */}
          <div className="w-6 shrink-0 mt-0.5">
            {opensRun && !mine && <Skeleton className="size-6 rounded-full" />}
          </div>

          <div
            className={cn(
              "flex flex-col gap-0.75 min-w-0 max-w-[85%] sm:max-w-[75%] md:max-w-[70%]",
              mine ? "items-end" : "items-start",
            )}
          >
            <Skeleton className={cn("rounded-lg", width, height)} />

            {closesRun && (
              <div className="flex items-center gap-1 px-1">
                <Skeleton className="h-2.5 w-10 rounded-full" />
                {mine && <Skeleton className="size-2.5 rounded-full" />}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
