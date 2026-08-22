/**
 * invoice.ts — the invoice IS the order (D-05, FR-14). There is no invoice table;
 * an invoice is computed on read from the order's snapshotted prices, its lines'
 * actual weights, and its payments.
 *
 * Per chicken: charge = actual_weight × unit_price (+ cleaning price if that line
 * is being cleaned). Lines are grouped into batches (bags) for split weigh-outs
 * (FR-14ب), but the order always has exactly ONE total, paid, and remaining.
 */
import type { Tables } from "@/types/database";
import type { PaymentStatus } from "@/lib/constants";

type OrderRow = Pick<Tables<"orders">, "unit_price" | "cleaning_price">;
type LineRow = Pick<
  Tables<"order_line">,
  "id" | "batch_no" | "position" | "actual_weight" | "cleaning"
>;
type PaymentRow = Pick<Tables<"payment">, "amount">;

export interface LineCharge {
  line: LineRow;
  weightCharge: number;
  cleaningCharge: number;
  total: number;
}

export interface BatchSummary {
  batchNo: number;
  lines: LineCharge[];
  subtotal: number;
}

export interface Invoice {
  batches: BatchSummary[];
  /** Every actual weight added up — the كجم in the invoice's own explanation. */
  totalWeight: number;
  chickenTotal: number; // sum of weight charges only
  cleaningTotal: number;
  total: number;
  paid: number;
  remaining: number;
  paymentStatus: PaymentStatus;
}

/** Round to piasters (2 decimals) — money never carries float noise. */
const toPiasters = (n: number): number => Math.round(n * 100) / 100;

/**
 * The grand total is whole pounds: under 50 piasters is dropped, 50 or over
 * becomes a pound (Khaled, 2026-08-19). Nobody on this farm hands over change,
 * and a price read aloud as "ألف وأربعمية وأربعة وستين" is one the customer can
 * repeat back.
 *
 * Rounded once, on the total — never per bird. Five birds rounded one by one can
 * drift the invoice by more than two pounds away from the sum of what was
 * actually weighed, and it is the sum the admin says out loud.
 */
const toPounds = (n: number): number => Math.round(n);

/** Weights add up to the gram (3 decimals), the way the scale reads them. */
const toGrams = (n: number): number => Math.round(n * 1000) / 1000;

/**
 * Compute an order's full invoice. Lines with no actual weight yet contribute
 * nothing, so a not-yet-weighed order returns a zero invoice.
 */
export function computeInvoice(
  order: OrderRow,
  lines: LineRow[],
  payments: PaymentRow[] = [],
): Invoice {
  const unitPrice = order.unit_price ?? 0;
  const cleaningPrice = order.cleaning_price ?? 0;

  const charges: LineCharge[] = lines.map((line) => {
    const weight = line.actual_weight ?? 0;
    const weightCharge = weight * unitPrice;
    const cleaningCharge = line.cleaning ? cleaningPrice : 0;
    return {
      line,
      weightCharge,
      cleaningCharge,
      total: weightCharge + cleaningCharge,
    };
  });

  // Group into batches, preserving line order within each batch.
  const batchMap = new Map<number, LineCharge[]>();
  for (const charge of charges) {
    const list = batchMap.get(charge.line.batch_no) ?? [];
    list.push(charge);
    batchMap.set(charge.line.batch_no, list);
  }

  const batches: BatchSummary[] = [...batchMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([batchNo, batchLines]) => ({
      batchNo,
      lines: batchLines.sort((a, b) => a.line.position - b.line.position),
      subtotal: toPiasters(
        batchLines.reduce((sum, c) => sum + c.total, 0),
      ),
    }));

  const totalWeight = toGrams(
    lines.reduce((sum, line) => sum + (line.actual_weight ?? 0), 0),
  );
  const chickenTotal = toPiasters(
    charges.reduce((sum, c) => sum + c.weightCharge, 0),
  );
  const cleaningTotal = toPiasters(
    charges.reduce((sum, c) => sum + c.cleaningCharge, 0),
  );
  const total = toPounds(chickenTotal + cleaningTotal);
  const paid = toPiasters(payments.reduce((sum, p) => sum + p.amount, 0));
  const remaining = toPiasters(total - paid);

  let paymentStatus: PaymentStatus;
  if (total <= 0 || remaining <= 0) paymentStatus = "paid";
  else if (paid > 0) paymentStatus = "partial";
  else paymentStatus = "unpaid";

  return {
    batches,
    totalWeight,
    chickenTotal,
    cleaningTotal,
    total,
    paid,
    remaining,
    paymentStatus,
  };
}

/** The outstanding balance on an order — the debt (FR-20). Never negative. */
export function orderRemaining(
  order: OrderRow,
  lines: LineRow[],
  payments: PaymentRow[] = [],
): number {
  return Math.max(0, computeInvoice(order, lines, payments).remaining);
}

/** One order reduced to the three parts an invoice is computed from. */
export interface OrderInvoiceInput {
  order: OrderRow;
  lines: LineRow[];
  payments: PaymentRow[];
}

/** The money side of a whole cycle, summed across its invoices (FR-19, FR-20). */
export interface InvoiceTotals {
  /** Everything the cycle has invoiced so far — "اجمالي الدخل". */
  income: number;
  /** Cash actually in hand — "في المحفظة". */
  collected: number;
  /** Still owed by customers — "الديون" (income − collected, never negative). */
  debt: number;
}

/**
 * Roll every order in a cycle into one money picture. Orders that aren't weighed
 * yet contribute nothing (their lines carry no actual weight), so this reflects
 * real sales only.
 *
 * **Two things the caller must do first:** drop cancelled orders, and drop house
 * orders — the family's own birds leave the flock but were never a sale, so they
 * carry no revenue and no debt (FR-36, D-59).
 *
 * Debt is summed **per order**, not netted across the cycle. Someone who
 * overpaid by a hundred does not settle someone else's hundred, and netting made
 * this figure disagree with the customers screen, which has always clamped per
 * order.
 */
export function sumInvoices(orders: OrderInvoiceInput[]): InvoiceTotals {
  let income = 0;
  let collected = 0;
  let owed = 0;
  for (const { order, lines, payments } of orders) {
    const invoice = computeInvoice(order, lines, payments);
    income += invoice.total;
    collected += invoice.paid;
    owed += Math.max(0, invoice.remaining);
  }
  return {
    income: toPiasters(income),
    collected: toPiasters(collected),
    debt: toPiasters(owed),
  };
}
