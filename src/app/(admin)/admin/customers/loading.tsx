import { Skeleton, SkeletonScreen } from "@/components/ui";

/** One customer row (A-30): the name line over the contact line. */
function CustomerRowSkeleton() {
  return (
    <div className="flex flex-col gap-2 px-screen py-3">
      {/* Index + name. */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-5 w-5" />
        <Skeleton className="h-5 w-36" />
      </div>

      {/* Phone + the contact pair on the right, what he owes on the left. */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-5.5">
          <Skeleton className="h-4.5 w-[11ch]" />
          <div className="flex gap-2">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="size-8 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-5.5 w-24" />
      </div>
    </div>
  );
}

/**
 * Loading face of the admin customers screen (A-30). Same frame as the page: the
 * pinned header (add + total owed · count and «الآجل» pills · search) over the
 * divided list of rows.
 */
export default function AdminCustomersLoading() {
  return (
    <SkeletonScreen>
      <div className="flex flex-col gap-4 pt-4 pb-3">
        {/* «اضافة عميل» on the right, «اجمالي الآجل» on the left. */}
        <div className="flex items-center justify-between gap-3 px-screen">
          <Skeleton className="h-11 w-32" />
          <div className="flex flex-col items-end gap-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-28" />
          </div>
        </div>

        {/* The count pill and the «الآجل» filter. */}
        <div className="flex items-center justify-between gap-3 px-screen">
          <Skeleton className="h-11 w-28" />
          <Skeleton className="h-11 w-20" />
        </div>

        <div className="px-screen">
          <Skeleton className="h-13 w-full rounded-lg" />
        </div>
      </div>

      {/* No gutter: it sits on the rows, so the dividers run the full width the
          way the real list draws them. */}
      <ul className="divide-y-2 divide-border pb-4">
        {[0, 1, 2, 3, 4, 5].map((row) => (
          <li key={row}>
            <CustomerRowSkeleton />
          </li>
        ))}
      </ul>
    </SkeletonScreen>
  );
}
