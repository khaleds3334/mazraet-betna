import { Button, InlineError } from "@/components/ui";
import type { Invoice } from "@/lib/calculations/invoice";
import { InvoiceTotal } from "../InvoiceTotal";

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
  invoice,
  unitPrice,
  error,
  saving,
  onSave,
}: {
  invoice: Invoice;
  unitPrice: number;
  error: string | null;
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <div className="flex shrink-0 flex-col gap-4 border-t-2 border-border px-screen pt-6">
      <InvoiceTotal invoice={invoice} unitPrice={unitPrice} size="lg" />

      {error && <InlineError message={error} />}

      <Button onClick={onSave} isLoading={saving}>
        حفظ الاوزان
      </Button>
    </div>
  );
}
