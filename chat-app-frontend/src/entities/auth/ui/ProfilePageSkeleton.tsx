import { Skeleton } from "@/shared/ui/shadcn/skeleton";

/** Mirrors ProfilePage's layout so the swap to real content doesn't shift. */
export function ProfilePageSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading profile"
      className="h-full w-full flex justify-center items-start overflow-y-auto p-4 md:p-8"
    >
      <div className="w-full max-w-2xl flex flex-col gap-6">
        {/* Page heading */}
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>

        {/* Identity card */}
        <div className="rounded-2xl bg-card ring-1 ring-foreground/10 flex justify-between items-center gap-4 px-5 py-5">
          <div className="flex-1 flex items-center gap-4 min-w-0">
            <Skeleton className="h-12 w-12 rounded-full shrink-0" />
            <div className="flex-1 flex flex-col gap-2 min-w-0">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-10 w-32 rounded-lg shrink-0" />
        </div>

        {/* Tabs + section card */}
        <div className="w-full flex flex-col">
          <Skeleton className="h-11 w-full rounded-full" />
          <div className="mt-4 rounded-2xl bg-card ring-1 ring-foreground/10 px-5 py-6 md:px-6 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-64 max-w-full" />
            </div>
            <Skeleton className="h-px w-full" />
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="flex flex-col gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            ))}
            <Skeleton className="h-10 w-32 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
