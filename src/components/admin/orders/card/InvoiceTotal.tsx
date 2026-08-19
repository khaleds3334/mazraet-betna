import type { Invoice } from "@/lib/calculations/invoice";
import { formatCurrency, formatWeight } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The order's price and the one line that explains how it was reached — the
 * block the admin reads out loud. It appears twice with the same words: at the
 * foot of the weighing sheet while the number is still moving (A-52), and on the
 * card once the order is weighed (A-50). `size` is the only difference.
 *
 * The explanation matters as much as the total. A customer who hears "١٣٠٤" and
 * nothing else has to trust it; one who hears the weight, the kilo price and the
 * cleaning can check it, which is what the paper notebook let him do.
 */
const SIZE = {
  sm: { total: "text-base", detail: "text-xs" },
  lg: { total: "text-h6", detail: "text-sm" },
} as const;

export function InvoiceTotal({
  invoice,
  unitPrice,
  size = "sm",
}: {
  invoice: Pick<Invoice, "total" | "totalWeight" | "cleaningTotal">;
  unitPrice: number;
  size?: keyof typeof SIZE;
}) {
  const style = SIZE[size];
  const cleaning =
    invoice.cleaningTotal > 0
      ? ` + ${formatCurrency(invoice.cleaningTotal)} تنظيف`
      : "";

  return (
    <div className="flex w-full flex-col gap-2">
      <div
        className={cn(
          "flex items-center justify-between font-bold text-primary-foreground",
          style.total,
        )}
      >
        <span>اجمالي السعر النهائي</span>
        <span>{formatCurrency(invoice.total)}</span>
      </div>
      <p className={cn("text-center text-muted", style.detail)}>
        ({formatWeight(invoice.totalWeight)} × {formatCurrency(unitPrice)})
        {cleaning} = {formatCurrency(invoice.total)}
      </p>
    </div>
  );
}
