import { Skeleton } from "@/components/ui";

/**
 * One placeholder order card, in the shape `OrderCardShell` draws — the tracking
 * list and the history list are the same card, so their loading screens are the
 * same block.
 *
 * It lives beside the shell rather than inside a `loading.tsx` because two
 * routes stand in for it, and a card drawn twice by hand drifts the first time
 * the real one's padding is nudged.
 *
 * `rows` because the middle block is not one height: an order under review reads
 * three lines, one that has been through the scale reads four.
 */
export function OrderCardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="flex w-full flex-col gap-3.5 rounded-xl border border-border bg-surface-page py-[18px] shadow-card">
      {/* Order number and the date under it on the right; the status pill left. */}
      <div className="flex items-center justify-between gap-2 px-card">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-36" />
        </div>
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>

      {/* The rule runs full-bleed on the real card too. */}
      <div className="h-[1.5px] w-full bg-skeleton" />

      <div className="flex flex-col gap-[7px] px-card">
        {Array.from({ length: rows }, (_, row) => (
          <div key={row} className="flex items-center justify-between gap-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>

      {/* The closing sentence, with the 35px arrow opposite it. */}
      <div className="flex items-center justify-between gap-2 px-card">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="size-9 shrink-0" />
      </div>
    </div>
  );
}
