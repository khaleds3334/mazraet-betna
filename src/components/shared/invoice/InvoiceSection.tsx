import type { Invoice } from "@/lib/calculations/invoice";
import {
  formatArabicNumber,
  formatCurrency,
  formatWeight,
  pluralizeChicken,
} from "@/lib/format";
import { SectionBand } from "./SectionBand";

/** One labelled figure. Bold and dark for a total, plain green for the rest. */
function Line({
  label,
  value,
  caption,
  strong = false,
}: {
  label: string;
  value: string;
  caption?: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex flex-col items-end gap-1">
        <span className={strong ? "font-bold" : undefined}>{label}</span>
        {caption && <span className="text-xs">{caption}</span>}
      </div>
      <span className={strong ? "font-bold" : undefined}>{value}</span>
    </div>
  );
}

/**
 * «الفاتورة» — the order priced out, read top to bottom: what was taken, what it
 * came to before cleaning, the cleaning, and the one number that matters.
 *
 * Shared between the admin's invoice sheet and the customer's order details: the
 * same figures, computed once by `computeInvoice`, so the two can never quote a
 * customer different numbers for the same order. A pure view — it takes an
 * invoice and renders it, and knows nothing about who is reading.
 */
export function InvoiceSection({
  invoice,
  unitPrice,
  cleaningPrice,
  showPayments = false,
}: {
  invoice: Invoice;
  unitPrice: number;
  cleaningPrice: number;
  /** Adds المدفوع / المتبقي — once money has moved, or once it is due. */
  showPayments?: boolean;
}) {
  const lines = invoice.batches.flatMap((batch) => batch.lines);
  const cleaned = lines.filter((charge) => charge.line.cleaning).length;

  return (
    <section className="flex w-full flex-col items-center gap-2">
      <SectionBand>الفاتورة</SectionBand>

      {/* The band above runs full-bleed; the card keeps the screen's gutter. */}
      <div className="w-full px-screen">
        <div className="flex flex-col gap-5 rounded-lg border border-border bg-surface-page p-4 text-base text-foreground shadow-card">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 border-b border-border pb-3">
              <Line
                label="اجمالي عدد الفراخ"
                value={pluralizeChicken(lines.length)}
                strong
              />
              <Line
                label="اجمالي وزن الفراخ"
                value={formatWeight(invoice.totalWeight)}
                strong
              />
            </div>

            <div className="flex flex-col gap-3 border-b-2 border-border pb-3">
              <Line
                label="سعر الفراخ قبل التنظيف"
                value={formatCurrency(invoice.chickenTotal)}
                strong
              />
              {invoice.cleaningTotal > 0 && (
                <Line
                  label="سعر التنظيف"
                  caption={`${pluralizeChicken(cleaned)} × ${formatCurrency(cleaningPrice)}`}
                  value={formatCurrency(invoice.cleaningTotal)}
                  strong
                />
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 text-center">
            <div className="flex items-center justify-between font-bold text-primary-foreground">
              <span>اجمالي السعر النهائي</span>
              <span>{formatCurrency(invoice.total)}</span>
            </div>

            {showPayments && (
              <>
                <div className="flex items-center justify-between">
                  <span>المبلغ المدفوع</span>
                  <span>{formatCurrency(invoice.paid)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>المبلغ المتبقي</span>
                  <span>
                    {invoice.remaining > 0
                      ? formatCurrency(invoice.remaining)
                      : "لا يوجد"}
                  </span>
                </div>
              </>
            )}

            <p className="text-xs text-muted">
              ({formatWeight(invoice.totalWeight)} ×{" "}
              {formatArabicNumber(unitPrice)} جنيه)
              {invoice.cleaningTotal > 0 &&
                ` + ${formatCurrency(invoice.cleaningTotal)} تنظيف`}{" "}
              = {formatCurrency(invoice.total)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
