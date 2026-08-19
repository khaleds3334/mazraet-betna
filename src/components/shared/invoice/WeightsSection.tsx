import type { BatchSummary, Invoice } from "@/lib/calculations/invoice";
import {
  formatArabicNumber,
  formatCurrency,
  formatWeight,
  pluralizeChicken,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { SectionBand } from "./SectionBand";

/** Bag names, in the order the admin fills them (FR-14ب). */
const BATCH_NAMES = [
  "الوزنة الأولى",
  "الوزنة الثانية",
  "الوزنة الثالثة",
  "الوزنة الرابعة",
  "الوزنة الخامسة",
];

/** The four columns, right to left: which bird, its weight, its price, cleaning. */
function Row({
  index,
  weight,
  price,
  cleaning,
  variant = "body",
}: {
  index: string;
  weight: string;
  price: string;
  cleaning: string;
  variant?: "head" | "body" | "total";
}) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-between",
        variant === "head" &&
          "border-b border-brand bg-surface py-[3px] text-base text-primary-foreground",
        variant === "body" && "border-b border-border py-1 text-sm text-foreground",
        variant === "total" &&
          "border-b-2 border-brand py-1 text-base text-primary-foreground",
      )}
    >
      <span className="w-5 shrink-0">{index}</span>
      <span className="w-[70px] shrink-0">{weight}</span>
      <span className="w-[70px] shrink-0">{price}</span>
      <span className="w-[60px] shrink-0">{cleaning}</span>
    </div>
  );
}

/** One bag: its own table and its own subtotal, so each bag has a price. */
function Batch({ batch, showName }: { batch: BatchSummary; showName: boolean }) {
  const weight = batch.lines.reduce(
    (sum, charge) => sum + (charge.line.actual_weight ?? 0),
    0,
  );
  const chickens = batch.lines.reduce((sum, c) => sum + c.weightCharge, 0);
  const cleaning = batch.lines.reduce((sum, c) => sum + c.cleaningCharge, 0);

  return (
    <div className="flex w-full flex-col gap-2">
      {showName && (
        <div className="flex items-center justify-between text-base font-bold text-primary-foreground">
          <span>{BATCH_NAMES[batch.batchNo - 1] ?? "وزنة أخرى"}</span>
          <span>{pluralizeChicken(batch.lines.length)}</span>
        </div>
      )}

      <div className="flex w-full flex-col gap-px text-center">
        <Row
          variant="head"
          index="#"
          weight="الوزن"
          price="السعر"
          cleaning="التنظيف"
        />
        {batch.lines.map((charge, position) => (
          <Row
            key={charge.line.id}
            index={formatArabicNumber(position + 1)}
            weight={formatWeight(charge.line.actual_weight ?? 0)}
            price={formatCurrency(charge.weightCharge)}
            cleaning={formatCurrency(charge.cleaningCharge)}
          />
        ))}
        <Row
          variant="total"
          index={formatArabicNumber(batch.lines.length)}
          weight={formatWeight(weight)}
          price={formatCurrency(chickens)}
          cleaning={formatCurrency(cleaning)}
        />
      </div>
    </div>
  );
}

/**
 * «الاوزان» — every bird on the scale, one row each, then what the bag came to.
 *
 * The bag names only appear once an order has been split across more than one
 * (FR-14ب); a plain order is one table with no heading over it, which is what
 * the design draws. Shared with the customer's order details, where the same
 * table is the proof behind the price.
 */
export function WeightsSection({ invoice }: { invoice: Invoice }) {
  const split = invoice.batches.length > 1;

  return (
    <section className="flex w-full flex-col items-start gap-2">
      <SectionBand>الاوزان</SectionBand>

      <div className="flex w-full flex-col items-center gap-4 px-screen">
        {invoice.batches.map((batch) => (
          <Batch key={batch.batchNo} batch={batch} showName={split} />
        ))}

        {/* What the two columns add up to — the same total the invoice above
            reports, reached the long way. */}
        <div className="flex w-full items-center justify-between text-base text-primary-foreground">
          <span>السعر الاجمالي</span>
          <span className="flex items-center gap-1.5">
            <span>{formatCurrency(invoice.chickenTotal)}</span>
            <span>+</span>
            <span>{formatCurrency(invoice.cleaningTotal)}</span>
          </span>
          <span>=</span>
          <span>{formatCurrency(invoice.total)}</span>
        </div>
      </div>
    </section>
  );
}
