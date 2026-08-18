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

  const chickenTotal = toPiasters(
    charges.reduce((sum, c) => sum + c.weightCharge, 0),
  );
  const cleaningTotal = toPiasters(
    charges.reduce((sum, c) => sum + c.cleaningCharge, 0),
  );
  const total = toPiasters(chickenTotal + cleaningTotal);
  const paid = toPiasters(payments.reduce((sum, p) => sum + p.amount, 0));
  const remaining = toPiasters(total - paid);

  let paymentStatus: PaymentStatus;
  if (total <= 0 || remaining <= 0) paymentStatus = "paid";
  else if (paid > 0) paymentStatus = "partial";
  else paymentStatus = "unpaid";

  return {
    batches,
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
 * real sales only. Cancelled orders must be filtered out before calling.
 */
export function sumInvoices(orders: OrderInvoiceInput[]): InvoiceTotals {
  let income = 0;
  let collected = 0;
  for (const { order, lines, payments } of orders) {
    const invoice = computeInvoice(order, lines, payments);
    income += invoice.total;
    collected += invoice.paid;
  }
  return {
    income: toPiasters(income),
    collected: toPiasters(collected),
    debt: Math.max(0, toPiasters(income - collected)),
  };
}
