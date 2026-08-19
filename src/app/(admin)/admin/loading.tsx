import { Skeleton, SkeletonScreen } from "@/components/ui";

/** A headline stat tile (`CycleStatCard`) — icon, caption, big value. */
function StatCardSkeleton() {
  return (
    <div className="flex w-full flex-col items-center justify-between gap-2 rounded-xl border-2 border-border bg-surface px-1 py-2">
      <div className="flex flex-col items-center gap-1">
        <Skeleton className="size-6" />
        <Skeleton className="h-4 w-14" />
      </div>
      <Skeleton className="h-7 w-16" />
    </div>
  );
}

/**
 * Loading face of the admin home. The home has three faces (raising · selling ·
 * no cycle yet) and nothing here knows which one is coming, so it draws the
 * shape the two dashboards share — header, three headline tiles, the record
 * actions, a figures row, a titled section. On a farm with a running cycle,
 * which is the normal case, that's the screen that arrives.
 */
export default function AdminHomeLoading() {
  return (
    <SkeletonScreen className="gap-6 px-screen pt-4 pb-6">
      {/* Cycle header: the gear alone on the left, then the cycle's identity. */}
      <header className="flex flex-col">
        <Skeleton className="size-11 self-end rounded-full" />
        <div className="flex flex-col items-start gap-2">
          <div className="flex items-center gap-3">
            <Skeleton className="size-6" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-3">
        {/* Age · expenses · mortality. */}
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((tile) => (
            <StatCardSkeleton key={tile} />
          ))}
        </div>

        {/* Record expense (wide) on the right, record mortality on the left. */}
        <div className="flex items-stretch justify-between gap-3">
          <Skeleton className="h-13 flex-1" />
          <Skeleton className="h-13 w-13" />
        </div>
      </div>

      {/* The three feed figures, then the withdraw-bag button. */}
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((tile) => (
            <Skeleton key={tile} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-11 w-2/3 self-center" />
      </div>

      {/* A titled section — the feed grid on the raising face. */}
      <section className="flex flex-col gap-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </section>
    </SkeletonScreen>
  );
}
