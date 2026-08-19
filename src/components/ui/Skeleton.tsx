import { cn } from "@/lib/utils";

/**
 * One grey placeholder block — a bar, a tile, a circle.
 *
 * The brick every `loading.tsx` is built from: while Next fetches a screen we
 * draw that screen's shape in grey, so a tap gets an answer immediately instead
 * of the old screen sitting still. Silence after a tap is what makes this admin
 * tap again (the same reason the toast system exists — see BUILD-WORKFLOW §5).
 *
 * Size, shape and radius come from the caller: a skeleton is only worth drawing
 * when it matches the thing it stands in for.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        // motion-reduce: the pulse is decoration; a user who asked the phone for
        // less movement still gets the layout, just without the breathing.
        "animate-pulse rounded-md bg-skeleton motion-reduce:animate-none",
        className,
      )}
    />
  );
}

/**
 * The root of a loading screen. Carries the one announcement a screen reader
 * needs — the blocks themselves are `aria-hidden`, so it reads "جاري التحميل"
 * once instead of listing a dozen empty boxes.
 */
export function SkeletonScreen({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="جاري التحميل"
      className={cn("flex flex-1 flex-col", className)}
    >
      {children}
    </div>
  );
}
