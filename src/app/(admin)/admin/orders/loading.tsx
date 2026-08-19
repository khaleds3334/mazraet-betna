import { Skeleton, SkeletonScreen } from "@/components/ui";

/** One order card's frame (A-50) with its content in grey. */
function OrderCardSkeleton() {
  return (
    <div className="flex flex-col gap-[13px] rounded-xl border-2 border-border p-4 shadow-card">
      {/* Order number + placed-at on the right, the status badge on the left. */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col items-end gap-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-7 w-20 rounded-full" />
      </div>

      {/* Customer name + phone on the right, the call/WhatsApp pair on the left. */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col items-end gap-1">
          <Skeleton className="h-4.5 w-28" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="size-9 rounded-full" />
        </div>
      </div>

      {/* The three figures of the order. */}
      <div className="flex items-start justify-between gap-2">
        {[0, 1, 2].map((column) => (
          <div key={column} className="flex flex-col items-center gap-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>

      <Skeleton className="h-11 w-full" />
    </div>
  );
}

/**
 * Loading face of the admin orders screen (A-50). Same frame as the page: the
 * pinned header (add + filter · search · tabs) over a stack of order cards.
 *
 * Three cards, not the real count — nobody knows it yet, and three is enough to
 * read as "a list is coming" on the shortest phone we support.
 */
export default function AdminOrdersLoading() {
  return (
    <SkeletonScreen>
      <div className="flex flex-col gap-4 pt-4 pb-3">
        {/* «اضافة طلب» on the right, the cycle funnel on the left. */}
        <div className="flex items-center justify-between gap-3 px-screen">
          <Skeleton className="h-11 w-32" />
          <Skeleton className="size-9.5" />
        </div>

        <div className="px-screen">
          <Skeleton className="h-13 w-full rounded-lg" />
        </div>

        {/* The three status tabs. */}
        <div className="flex items-center justify-between gap-2 px-screen">
          {[0, 1, 2].map((tab) => (
            <Skeleton key={tab} className="h-11 flex-1 rounded-xl" />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 px-screen pb-4">
        {[0, 1, 2].map((card) => (
          <OrderCardSkeleton key={card} />
        ))}
      </div>
    </SkeletonScreen>
  );
}
