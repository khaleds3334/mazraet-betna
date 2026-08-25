import { Skeleton, SkeletonScreen } from "@/components/ui";
import { OrderCardSkeleton } from "@/components/customer/OrderCardSkeleton";

/**
 * Loading face of «تتبع الطلب» (C-30→C-35).
 *
 * Draws the single-order face: the stage glyph over one card, centred. That is
 * what the customer who taps this tab is nearly always going to — the badge on
 * the tab told him how many he has, and for these customers the number is one.
 * The list face is the same card repeated, and the empty face centres a block of
 * roughly this height, so neither lands far from where the grey was.
 *
 * The ring is drawn for real and only the glyph inside it is grey (T-69): the
 * circle is on this screen whatever the order is doing — which stage it has
 * reached is the part being fetched.
 *
 * `pb-24` is what the page gives the single-order face: on this section the bar
 * grows «الطلبات السابقة» above the tabs, and `<main>` only reserves the plain
 * bar's height — so the card centres in what is actually left.
 */
export default function TrackingLoading() {
  return (
    <SkeletonScreen className="gap-4 px-screen pb-24">
      <div className="my-auto flex flex-col gap-9">
        <div className="flex justify-center">
          {/* `IconRing`'s own shape — a 132px circle with a hairline border. */}
          <div className="flex size-33 shrink-0 items-center justify-center rounded-full border border-border">
            <Skeleton className="size-26 rounded-full" />
          </div>
        </div>

        <OrderCardSkeleton />
      </div>
    </SkeletonScreen>
  );
}
