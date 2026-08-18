import { Icon } from "@/components/ui";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * A wallet with an amount beside it — the farm's total outstanding (A-30 header)
 * and each customer's own on their row. One component because both draw the same
 * thing at two sizes.
 *
 * Colour carries the meaning: tan while money is owed, plain green once it's all
 * settled, so the admin can spot a debtor by colour alone without reading digits
 * (Khaled, 2026-08-18).
 */
export function DebtAmount({
  amount,
  iconSize = 24,
}: {
  amount: number;
  iconSize?: number;
}) {
  return (
    <p
      className={cn(
        "flex shrink-0 items-center gap-1 text-h6 font-bold",
        amount > 0 ? "text-accent-tan" : "text-foreground",
      )}
    >
      {/* Mirrored the way the design draws it, so the wallet's opening faces the
          amount. Same flip as the sidebar's debt card. */}
      <Icon name="debt" size={iconSize} className="shrink-0 -scale-x-100" />
      <span className="optical-center truncate">{formatCurrency(amount)}</span>
    </p>
  );
}
