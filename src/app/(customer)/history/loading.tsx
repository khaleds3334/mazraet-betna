import { Chip, SkeletonScreen } from "@/components/ui";
import { HistoryHeading } from "@/components/customer/history/HistoryHeading";
import { OrderCardSkeleton } from "@/components/customer/OrderCardSkeleton";

/** The three filters, in the design's order — مدفوع · عليه فلوس · ملغي. */
const FILTERS = ["مدفوع", "عليه فلوس", "ملغي"];

/**
 * Loading face of «طلباتك السابقة» (C-50→C-52).
 *
 * Draws the list, not the empty state: a customer reaches this screen from the
 * home button and from the tracking bar, and the reason he taps it is that he
 * has orders behind him. The empty face is seen once.
 *
 * **The whole top of the screen is real** (T-69) — the same `HistoryHeading` the
 * page itself draws, back button and all, and the three chips with their own
 * words on them. None of it depends on an answer, so none of it is grey, and
 * none of it moves when the cards arrive. The back button works while the list
 * is still coming, which is the point of drawing the real one.
 *
 * The chips carry no `onClick` yet — there is nothing to filter until the orders
 * land, and the page below replaces them with the same three, lit.
 */
export default function HistoryLoading() {
  return (
    <SkeletonScreen>
      <div className="pb-1">
        <HistoryHeading />

        <div className="no-scrollbar flex justify-center gap-2.5 overflow-x-auto px-screen py-4">
          {FILTERS.map((label) => (
            <Chip key={label} label={label} />
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
