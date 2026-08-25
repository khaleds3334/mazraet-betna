import { Skeleton, SkeletonScreen } from "@/components/ui";

/** One placeholder notice: the mark on the right, the words, the time under. */
function NotificationRowSkeleton() {
  return (
    <div className="flex flex-col items-end justify-center gap-1.5 border-b-2 border-border py-2">
      <div className="flex w-full items-center gap-2.5">
        <Skeleton className="size-10 shrink-0 rounded-full" />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

/**
 * Loading face of «الرسائل و الاشعارات» (C-15).
 *
 * The title and the back button are pinned on the real screen and the notices
 * scroll under them, so they are drawn first and the rows follow. One group —
 * «الجديدة» — because a customer opening this screen is opening it for the
 * unread ones; «القديمة» is the same block again further down.
 */
export default function NotificationsLoading() {
  return (
    <SkeletonScreen>
      <div className="pb-2">
        {/* `PageHeader`: the back button at the reading edge, the title laid
            over the row and centred against the screen. */}
        <header className="relative flex min-h-12 items-center px-screen pt-4">
          <Skeleton className="size-12 rounded-xl" />
          <Skeleton className="absolute inset-x-0 mx-auto h-6 w-40" />
        </header>
      </div>

      <section className="flex flex-col gap-1 px-screen pt-6">
        <Skeleton className="mb-1 h-5 w-20" />
        {[0, 1, 2, 3].map((row) => (
          <NotificationRowSkeleton key={row} />
        ))}
      </section>
    </SkeletonScreen>
  );
}
