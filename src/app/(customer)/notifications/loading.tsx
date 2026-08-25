import { PageHeader, Skeleton, SkeletonScreen } from "@/components/ui";

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
 * The real header, because it is the real header: the title never changes and
 * back always means home from here, so both are drawn rather than greyed (T-69)
 * — and the back button works while the notices are still on their way, which
 * matters on the one screen whose only exit is that button.
 *
 * Four rows and no group heading. «الجديدة» over an empty group would be a
 * promise of unread mail the farm may not have — that heading only exists when
 * something is under it, so it waits with the rows it belongs to.
 */
export default function NotificationsLoading() {
  return (
    <SkeletonScreen>
      <div className="pb-2">
        <PageHeader
          title="الرسائل و الاشعارات"
          backHref="/"
          className="px-screen pt-4"
        />
      </div>

      <div className="flex flex-col gap-1 px-screen pt-6">
        {[0, 1, 2, 3].map((row) => (
          <NotificationRowSkeleton key={row} />
        ))}
      </div>
    </SkeletonScreen>
  );
}
