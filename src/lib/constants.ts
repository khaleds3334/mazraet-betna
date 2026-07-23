/**
 * constants.ts — system-wide constants and label maps.
 * Business formulas do NOT live here; they live in /lib/calculations. This file
 * holds fixed values (raising period, temperature table) and the Arabic labels
 * that map database enum values to what each user sees.
 */
import type { Enums } from "@/types/database";

export type OrderStatus = Enums<"order_status">;
export type ExpenseCategory = Enums<"expense_category">;

/** A raising cycle runs 30 days before the selling phase (FR-4). */
export const RAISING_PERIOD_DAYS = 30;

/**
 * Expected brooding temperature per week of the cycle (FR-6, display only).
 * 34° in week 1, down ~2° each week, floor ~27–28°. Index 0 = week 1.
 */
export const WEEKLY_TEMPERATURE_C = [34, 32, 30, 28, 27] as const;

/** Feed model (FR-22). A bag is 50 kg; per-chick lifetime consumption ≈ 3.5 kg. */
export const FEED_BAG_KG = 50;
export const FEED_PER_CHICK_KG = {
  grower: 0.75, // بادي (starter phase)
  finisher: 2.75, // نامي (grower phase)
} as const;

/**
 * ⚠️ PROVISIONAL — review with Khaled. Assumed price of one 50kg feed bag, used
 * only to *estimate* a cycle's expected expenses on the create-cycle sheet (A-41)
 * before any real feed is purchased. Real feed cost comes from the `feed` table
 * once bags are actually bought (FR-22). Tune this to a realistic 2026 price.
 */
export const ASSUMED_FEED_BAG_PRICE = 1200;

/**
 * Order status labels differ by viewer (D-03): a `pending` order reads
 * "قيد المراجعة" to the customer (their weights are being checked) but
 * "في الانتظار" to the admin (waiting for the pickup time).
 */
export const ORDER_STATUS_LABEL: Record<
  "admin" | "customer",
  Record<OrderStatus, string>
> = {
  admin: {
    pending: "في الانتظار",
    weighed: "تم الوزن",
    ready: "جاهز للاستلام",
    delivered: "تم التسليم",
    cancelled: "ملغي",
  },
  customer: {
    pending: "قيد المراجعة",
    weighed: "تم الوزن",
    ready: "جاهز للاستلام",
    delivered: "تم التسليم",
    cancelled: "ملغي",
  },
};

/**
 * Admin order tabs are groups of statuses, not statuses themselves (FR-12).
 * "ملغي" is a side state and lives outside these tabs.
 */
export const ADMIN_ORDER_TABS: {
  key: "new" | "active" | "done";
  label: string;
  statuses: OrderStatus[];
}[] = [
  { key: "new", label: "الجديدة", statuses: ["pending"] },
  { key: "active", label: "قيد التشغيل", statuses: ["weighed", "ready"] },
  { key: "done", label: "المكتملة", statuses: ["delivered"] },
];

/** Manual expense categories (FR-18 / Phase 7 chips). */
export const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  feed: "علف",
  utilities: "مياه وكهرباء",
  medicine: "أدوية",
  other: "أخرى",
};

/** Payment status of an order's invoice at any moment (FR-17). */
export type PaymentStatus = "paid" | "partial" | "unpaid";

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  paid: "مدفوع بالكامل",
  partial: "مدفوع جزئياً",
  unpaid: "غير مدفوع",
};
