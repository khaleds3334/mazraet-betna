import { Skeleton } from "@/components/ui";

/**
 * Loading face of a cycle's page (A-45): the header, the money tiles, the flock
 * row, the feed grid and the weight pie, in the same order the real screen puts
 * them — so nothing moves when the figures land.
 */
export default function AdminCycleDetailLoading() {
  return (
    <div className="flex flex-col gap-8 px-screen py-4" aria-busy="true">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Skeleton className="size-12 rounded-xl" />
          <Skeleton className="h-6 flex-1" />
        </div>
        <Skeleton className="h-3.5 w-full" />
      </div>

      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-25 rounded-xl" />
          <Skeleton className="h-25 rounded-xl" />
          <Skeleton className="h-25 rounded-xl" />
        </div>
        <Skeleton className="h-25 rounded-xl" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-25 rounded-xl" />
        <Skeleton className="h-25 rounded-xl" />
        <Skeleton className="h-25 rounded-xl" />
      </div>

      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-33 w-full rounded-md" />
      </div>

      <div className="flex items-center justify-between gap-4">
        <Skeleton className="size-[135px] rounded-full" />
        <Skeleton className="h-25 flex-1" />
      </div>
    </div>
  );
}
