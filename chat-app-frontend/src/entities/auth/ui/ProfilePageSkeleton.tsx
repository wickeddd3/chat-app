import { Skeleton } from "@/shared/ui/shadcn/skeleton";

export function ProfilePageSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading profile"
      className="h-full w-full flex justify-center items-center p-4 overflow-auto"
    >
      <div className="h-full max-w-2xl w-full md:w-2xl flex flex-col gap-8 rounded-lg">
        {/* Profile Header */}
        <div className="bg-gray-100 rounded-lg flex justify-between items-center gap-4 px-4 py-6">
          <div className="flex-1 flex items-center gap-4 min-w-0">
            <Skeleton className="h-12 w-12 rounded-full shrink-0" />
            <div className="flex-1 flex flex-col gap-2 min-w-0">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-10 w-32 rounded-lg shrink-0" />
        </div>

        {/* Section heading */}
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Tabs + form card */}
        <div className="w-full flex flex-col gap-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <div className="border rounded-lg py-10 px-6 flex flex-col gap-6">
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
