import { Skeleton, SkeletonScreen } from "@/components/ui";
import { OrderCardSkeleton } from "@/components/customer/OrderCardSkeleton";

/**
 * Loading face of «طلباتك السابقة» (C-50→C-52).
 *
 * Draws the list, not the empty state: a customer reaches this screen from the
 * home button and from the tracking bar, and the reason he taps it is that he
 * has orders behind him. The empty face is seen once.
 *
 * The heading, the caption and the three filter chips are one pinned block on
 * the real screen — drawn here in the same order so nothing shifts when the
 * cards arrive underneath.
 */
export default function HistoryLoading() {
  return (
    <SkeletonScreen>
      <div className="pb-1">
        {/* `PageHeader`: the back button at the reading edge, the title laid
            over the row and centred against the screen. */}
        <header className="relative flex min-h-12 items-center px-screen pt-4">
          <Skeleton className="size-12 rounded-xl" />
          <Skeleton className="absolute inset-x-0 mx-auto h-6 w-40" />
        </header>

        {/* «هنا تقدر تشوف كل طلباتك، وحالات الدفع» — two lines, centred. */}
        <div className="flex flex-col items-center gap-1 pt-2">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-5 w-28" />
        </div>

        <div className="flex justify-center gap-2.5 px-screen py-4">
          {[0, 1, 2].map((chip) => (
            <Skeleton key={chip} className="h-9 w-24 rounded-full" />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 px-screen pb-3">
        {/* A finished order reads four lines — it has been through the scale. */}
        <OrderCardSkeleton rows={4} />
        <OrderCardSkeleton rows={4} />
      </div>
    </SkeletonScreen>
  );
}
