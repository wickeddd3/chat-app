import { Skeleton } from "@/shared/ui/shadcn/skeleton";

export interface ListSkeletonProps {
  count?: number;
}

export function ListSkeleton({ count = 8 }: ListSkeletonProps) {
  return (
    <div role="status" aria-label="Loading" className="w-full">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 border-b px-4 py-3">
          <Skeleton className="h-11 w-11 rounded-full shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
