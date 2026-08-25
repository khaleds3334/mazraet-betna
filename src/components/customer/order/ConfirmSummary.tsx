import { Icon } from "@/components/ui";
import {
  formatCurrency,
  formatPricePerKilo,
  formatWeight,
  pluralizeChicken,
} from "@/lib/format";
import { ChickenTray } from "./ChickenTray";

/**
 * The order read back to the customer, above the confirm button (Figma
 * 4084:1613).
 *
 * Four facts and a picture, in two columns beside the tray: what he is getting
 * on the right — how many and how heavy — and what it costs on the left — the
 * kilo price and, if he asked for it, the cleaning. He scrolled past all four of
 * these sections to get here and is about to commit; repeating them is cheaper
 * than a confirmation dialog, which is a second screen for the same reassurance
 * and one more tap for someone who does not want any.
 *
 * **No total.** There is not one to give: the birds have not been weighed, so
 * every figure here is a rate or a count, never a sum. The line under the form
 * says exactly that, and inventing an estimate at the last moment before the
 * button is how a customer arrives at the farm expecting a number nobody
 * promised him.
 *
 * ## Reading order
 *
 * RTL, so the first child of a row is its rightmost. Tray, then the count
 * column, then the price column — and inside the cleaning line the knife comes
 * first, standing where «السعر :» stands in the line above it.
 *
 * `items-start` on the columns, not `items-end`: in RTL the start *is* the right
 * edge, which is where the design aligns both stacks.
 */
export function ConfirmSummary({
  count,
  weight,
  salePrice,
  cleaning,
  cleaningPrice,
}: {
  count: number;
  /** The chosen approximate weight (kg), or null before one is picked. */
  weight: number | null;
  /** Today's kilo price, quoted on the order (T-15 as amended). */
  salePrice: number;
  /** Whether he asked for slaughtering and cleaning. */
  cleaning: boolean;
  /** What cleaning one bird costs. */
  cleaningPrice: number;
}) {
  return (
    <div className="flex w-full items-center gap-3">
      <ChickenTray count={count} size="bar" />

      <div className="flex min-w-0 flex-1 items-center justify-between gap-2 text-foreground">
        <div className="flex flex-col items-start gap-1.5">
          <p className="whitespace-nowrap">
            <span className="text-base font-bold">عدد : </span>
            <span className="text-lg">{pluralizeChicken(count)}</span>
          </p>
          {weight != null && (
            <p className="whitespace-nowrap">
              <span className="text-base font-bold">الوزن : </span>
              <span className="text-sm">في حدود {formatWeight(weight)}</span>
            </p>
          )}
        </div>

        <div className="flex flex-col items-start gap-1.5">
          <p className="whitespace-nowrap">
            <span className="text-base font-bold">السعر : </span>
            <span className="text-sm">{formatPricePerKilo(salePrice)}</span>
          </p>
          {/* Only when he asked for it. A cleaning line reading «٠ جنيه» is a
              charge that isn't there, said out loud. The fee is flat per bird —
              the same rule `computeInvoice` charges by. */}
          {cleaning && (
            <p className="flex items-center gap-0.5 whitespace-nowrap">
              <Icon name="cleaning" size={24} aria-hidden />
              <span className="text-sm">
                {formatCurrency(count * cleaningPrice)}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
