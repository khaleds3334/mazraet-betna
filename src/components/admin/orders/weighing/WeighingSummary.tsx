import { Button, InlineError } from "@/components/ui";
import { formatCurrency, formatWeight } from "@/lib/format";

/**
 * The invoice foot of the weighing sheet (A-52) — the total, how it was reached,
 * and the save. It sits below the scrolling rows and never moves, because it is
 * the number the admin reads out to the customer while the birds are still in
 * his hands.
 *
 * The invoice is not a separate thing being previewed here: it IS the order
 * (D-05), so this recomputes live off the rows above it (FR-14).
 *
 * Saving is a critical action, so a failure stays on screen as an inline error
 * (rule 11) — a toast would fade while the admin is looking at the scale, and he
 * would walk away believing the weights were saved.
 */
export function WeighingSummary({
  total,
  totalWeight,
  unitPrice,
  cleaningTotal,
  error,
  saving,
  onSave,
}: {
  total: number;
  totalWeight: number;
  unitPrice: number;
  cleaningTotal: number;
  error: string | null;
  saving: boolean;
  onSave: () => void;
}) {
  const weights = `(${formatWeight(totalWeight)} × ${formatCurrency(unitPrice)})`;
  const cleaning =
    cleaningTotal > 0 ? ` + ${formatCurrency(cleaningTotal)} تنظيف` : "";

  return (
    <div className="flex shrink-0 flex-col gap-4 border-t-2 border-border px-screen pt-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-h6 font-bold text-primary-foreground">
          <span>اجمالي السعر النهائي</span>
          <span>{formatCurrency(total)}</span>
        </div>
        <p className="text-center text-sm text-muted">
          {weights}
          {cleaning} = {formatCurrency(total)}
        </p>
      </div>

      {error && <InlineError message={error} />}

      <Button onClick={onSave} isLoading={saving}>
        حفظ الاوزان
      </Button>
    </div>
  );
}
