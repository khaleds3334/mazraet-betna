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
 * Age (days) at which the admin may open the sale — the "بدء مرحلة البيع" button
 * un-blurs and becomes active. A few days before the full raising period so the
 * admin can open the sale as the birds approach selling weight.
 */
export const SALE_READY_MIN_DAY = 27;

/**
 * Whole length of a cycle in days — raising (~30) plus the selling window (~10).
 * The feed-consumption grid on the dashboard (A-11) is one square per day across
 * this span: day 1 is the first square, and a square lights up on the day a feed
 * bag is withdrawn.
 */
export const CYCLE_TOTAL_DAYS = 40;

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
 * One tap of ± on the weighing screen (A-52) — 5 grams. The admin types the
 * reading off the scale and then nudges it; 5 g is the finest correction he
 * actually makes, and it keeps a nudge from being a whole 10 g jump
 * (Khaled, 2026-08-19).
 */
export const WEIGHT_STEP_KG = 0.005;

/**
 * Order status labels, keyed by who is reading them (D-03). The two apps agreed
 * on "قيد المراجعة" for a pending order — that is what the A-50 card and the
 * customer's tracking both show — so the split currently only matters for the
 * statuses that come after it. See the D-03 amendment of 2026-08-18.
 */
export const ORDER_STATUS_LABEL: Record<
  "admin" | "customer",
  Record<OrderStatus, string>
> = {
  admin: {
    pending: "قيد المراجعة",
    // The admin's card says it in full — he is scanning a list of cards, and
    // "تم الوزن" alone reads as a step rather than a state (A-50 weighed).
    weighed: "تم وزن الفراخ",
    ready: "جاهز للاستلام",
    delivered: "تم التسليم",
    cancelled: "تم الغاء الطلب",
  },
  customer: {
    pending: "قيد المراجعة",
    weighed: "تم الوزن",
    ready: "جاهز للاستلام",
    delivered: "تم التسليم",
    cancelled: "ملغي",
  },
};

/** The three groups the admin sorts orders into on A-50 and A-20. */
export type AdminOrderTabKey = "new" | "active" | "done";

/**
 * Admin order tabs are groups of statuses, not statuses themselves (FR-12).
 * "المكتملة" means the order is finished with, either way it ended: delivered or
 * cancelled (Khaled, 2026-08-18) — a cancelled order has to land somewhere the
 * admin can still find it.
 */
export const ADMIN_ORDER_TABS: {
  key: AdminOrderTabKey;
  label: string;
  statuses: OrderStatus[];
}[] = [
  { key: "new", label: "الجديدة", statuses: ["pending"] },
  { key: "active", label: "قيد التشغيل", statuses: ["weighed", "ready"] },
  { key: "done", label: "المكتملة", statuses: ["delivered", "cancelled"] },
];

/**
 * The tab the orders screen opens on — the orders still waiting on the admin,
 * which is what he opens the screen to deal with.
 */
export const DEFAULT_ADMIN_ORDER_TAB: AdminOrderTabKey = "new";

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
