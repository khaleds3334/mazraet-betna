import { Skeleton } from "@/components/ui";

/** One placeholder cycle row: identity line, meta line, figures, debt line. */
function CycleRowSkeleton() {
  return (
    <div className="flex flex-col gap-2 border-b-2 border-primary bg-surface-page px-screen py-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-6 w-12" />
      </div>
      <Skeleton className="h-3.5 w-56" />

      <div className="flex items-start justify-between gap-2 pt-1">
        <Skeleton className="h-12 w-20" />
        <Skeleton className="h-12 w-24" />
        <Skeleton className="h-12 w-20" />
      </div>

      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-6 w-52" />
        <Skeleton className="size-8" />
      </div>
    </div>
  );
}

/**
 * Loading face of the admin cycles screen (A-42). Draws the steady state — the
 * list of cycles — rather than the empty state, because a farm sees "no cycles
 * yet" once and this screen every month after that.
 */
export default function AdminCyclesLoading() {
  return (
    <div className="flex flex-col gap-4 pt-4" aria-busy="true">
      <div className="flex items-center justify-between px-screen">
        <Skeleton className="h-11 w-44" />
        <Skeleton className="size-10" />
      </div>

      <div className="flex flex-col gap-2">
        <CycleRowSkeleton />
        <CycleRowSkeleton />
        <CycleRowSkeleton />
      </div>
    </div>
  );
}
