/**
 * constants.ts — system-wide constants and label maps.
 * Business formulas do NOT live here; they live in /lib/calculations. This file
 * holds fixed values (raising period, temperature table) and the Arabic labels
 * that map database enum values to what each user sees.
 */
import type { Enums } from "@/types/database";

export type OrderStatus = Enums<"order_status">;

/**
 * What an order is doing right now, as a person would say it — which is one
 * thing more than `order_status` has room for.
 *
 * Between the scale and the door the customer reads the invoice and releases the
 * birds for slaughtering (C-41 «التأكيد و الذبح», migration 028). That is a real
 * stage — the design gives it its own screen (C-42) and its own card — but it is
 * not a *status*: the four statuses are the four things the **admin** does, and
 * he does nothing here. Adding a fifth would put a step he never takes into the
 * middle of his tabs.
 *
 * So `status` stays the admin's ladder and the extra stage is derived from a
 * timestamp on the order — see {@link orderStage}. Every `OrderStatus` is an
 * `OrderStage`, so anything already passing a status keeps working.
 */
export type OrderStage = OrderStatus | "cleaning";

export type ExpenseCategory = Enums<"expense_category">;
/** Which feed a purchase was: بادي (starter) or نامي (grower) — migration 013. */
export type FeedPhase = Enums<"feed_phase">;

/**
 * A raising cycle runs 28 days before the selling phase. FR-4 wrote 30; 28 is
 * when these birds actually reach selling weight on this farm (Khaled,
 * 2026-08-21, migration 019). This is only the fallback — the live value is
 * `settings.raising_period_days`, which the admin owns.
 */
export const RAISING_PERIOD_DAYS = 28;

/**
 * Between cycles there is no cycle to date the next sale from, so the customer's
 * countdown runs on an estimate: {@link SALE_START_ROLL_DAYS} out, pushed forward
 * another {@link SALE_START_ROLL_STEP_DAYS} every time that many days pass with
 * no new cycle registered.
 *
 * **Why it rolls instead of just counting down:** a fixed date reaches zero, and
 * then the customer's home says the sale starts today when there are no birds —
 * the farm has not even bought chicks. Rolling keeps the promise vague but never
 * false: it always reads "about a month", which is the honest answer while the
 * admin has not committed to a date. The moment he picks one (A-70) or registers
 * a cycle, the real date takes over and the estimate is never used again.
 */
export const SALE_START_ROLL_DAYS = 34;
export const SALE_START_ROLL_STEP_DAYS = 6;

/**
 * How long a sale window runs by default: opening the selling phase dates its
 * end five days out (Khaled, 2026-08-21), which is what the customer's home
 * counts down to. The admin can move that date from settings (A-70) — the flock
 * decides when it actually ends, not the calendar.
 */
export const SALE_WINDOW_DAYS = 5;

/**
 * How long the customer's countdown gives a sale the admin closed **by hand**
 * before it rolls another one (FR-11). He closes it for an afternoon — he is out,
 * or the birds are not ready to hand over — and reopens it when he is back, which
 * is nearer than a day and not something a calendar knows.
 *
 * It rolls rather than expiring for the reason every estimate here rolls: a
 * countdown that reaches zero promises a sale that opens at that moment, and
 * nobody has promised the customer anything (Khaled, 2026-08-22).
 */
export const SALE_PAUSE_ROLL_HOURS = 8;

/**
 * Every weight the farm can put on offer (kg) — the badges on A-70. Which of
 * them a customer actually sees is `settings.available_weights`, the subset the
 * admin has ticked; this is the full row he ticks from.
 *
 * A constant rather than a table: these are the sizes a bird comes in, not a
 * setting. Listed smallest-first, which is the order the row is read in — in
 * RTL the first badge lands on the right (Khaled, 2026-08-22).
 */
export const OFFERED_WEIGHTS = [
  1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3,
] as const;

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
 * Fallback price of one 50kg feed bag — used **only on the very first cycle**,
 * when the farm has never bought a bag and there is no real price to read. From
 * the second cycle on, the create-cycle forecast (A-41) uses the price of the
 * last bag actually purchased, because bag prices move every few weeks and a
 * constant would be stale immediately (see `getCycleEstimateBasis`). Real feed
 * cost always comes from the `feed` table (FR-22).
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
  Record<OrderStage, string>
> = {
  admin: {
    pending: "قيد المراجعة",
    // The admin's card says it in full — he is scanning a list of cards, and
    // "تم الوزن" alone reads as a step rather than a state (A-50 weighed).
    weighed: "تم وزن الفراخ",
    // The same moment, named for what it means to each of them: the customer is
    // waiting for birds to be cleaned, the admin is being told he may start
    // (Khaled, 2026-08-25). This is D-03 doing exactly what it is for.
    cleaning: "تم تأكيد السعر",
    ready: "جاهز للاستلام",
    delivered: "تم التسليم",
    cancelled: "تم الغاء الطلب",
  },
  customer: {
    pending: "قيد المراجعة",
    // The tracking card says it in full, as the design does — "تم الوزن" alone
    // reads as a step rather than a state.
    weighed: "تم وزن الفراخ",
    // The stage named, not narrated (Khaled, 2026-08-25). On the card the pill
    // sits two lines above «يتم الان تنظيف الطلب و سيكون جاهز قريبا», and
    // «يتم الذبح و التنظيف» was the same sentence said twice.
    cleaning: "الذبح و التنظيف",
    ready: "جاهز للاستلام",
    delivered: "تم الاستلام",
    // The full sentence, not «ملغي» — the history screen carries a «ملغي»
    // filter chip three lines above these cards, and a pill wearing the same
    // word as the filter reads as "this is the filter you picked" (C-51).
    cancelled: "تم الغاء الطلب",
  },
};

/**
 * Which stage an order is actually at. Only one case is not the status itself:
 * a weighed order whose price the customer has confirmed is being slaughtered
 * and cleaned (migration 028).
 *
 * Written once, here beside {@link OrderStage}, because both apps read it — the
 * customer's card and details screen, and the admin's card, which shows the same
 * moment under its own name.
 */
export function orderStage(order: {
  status: OrderStatus;
  priceConfirmedAt: string | null;
}): OrderStage {
  return order.status === "weighed" && order.priceConfirmedAt
    ? "cleaning"
    : order.status;
}

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

/** The tab `?tab=` names, or null when it names nothing real. */
export function parseTab(
  value: string | null | undefined,
): AdminOrderTabKey | null {
  return ADMIN_ORDER_TABS.find((tab) => tab.key === value)?.key ?? null;
}

/**
 * Turns whatever `?tab=` happens to say into a real tab. Lives here, beside the
 * tabs themselves, because both sides of the app need it: the page resolves the
 * incoming URL on the server, and the browser resolves it again on back/forward.
 */
export function resolveTab(value: string | null | undefined): AdminOrderTabKey {
  return parseTab(value) ?? DEFAULT_ADMIN_ORDER_TAB;
}

/**
 * Which tab to open on when the URL doesn't say: the first one that has anything
 * in it, in the order the work moves — الجديدة → قيد التشغيل → المكتملة.
 *
 * Landing on an empty «الجديدة» while the work of the day sits one tab over reads
 * as "no orders" and costs a tap to disprove (Khaled, 2026-08-21). A cycle where
 * nothing has been ordered at all opens on «الجديدة» anyway — that is where the
 * first order will appear.
 */
export function defaultOrdersTab(
  counts: Record<AdminOrderTabKey, number>,
): AdminOrderTabKey {
  return (
    ADMIN_ORDER_TABS.find((tab) => counts[tab.key] > 0)?.key ??
    DEFAULT_ADMIN_ORDER_TAB
  );
}

/**
 * Why a bag can't be withdrawn. Lives here rather than beside the action because
 * both sides need the exact same sentence: the popup says it before he taps, and
 * the server says it if the store emptied while he was looking at the screen —
 * and a "use server" module may only export functions.
 */
/**
 * Why an order can't be booked. Same sentence in the sheet before he fills it in
 * and on the server if the sale closed while it was open — and a `"use server"`
 * module may only export functions, so it lives here.
 */
/**
 * Why an orphan order can't be handed over yet. Said in the card before the tap
 * and by the server on it — and a `"use server"` module may only export functions.
 */
export const ORPHAN_MUST_BE_PAID =
  "الطلب ده مش مربوط بعميل، فلازم يتدفع بالكامل قبل ما يتسلّم.";

export const SALE_NOT_OPEN =
  "البيع مش مفتوح دلوقتي، ابدأ مرحلة البيع الأول عشان تسجّل طلبات.";

export const NO_FEED_IN_STORE = "مفيش علف متوفر في المخزن، سجّل شراء علف الأول.";

export const FEED_PHASE_LABEL: Record<FeedPhase, string> = {
  badi: "بادي",
  nami: "نامي",
};

/**
 * The store isn't one pile: علف بادي and علف نامي are counted apart, and a bag of
 * one cannot be opened out of the other's stock. Written once because both sides
 * say it — the popup warns before the tap (A-13) and the action refuses after it.
 */
export function outOfPhaseFeed(phase: FeedPhase): string {
  return `مفيش علف ${FEED_PHASE_LABEL[phase]} في المخزن، سجّل شراء علف ${FEED_PHASE_LABEL[phase]} الأول.`;
}

/**
 * Half a bag left is not "no feed" — the popup ticks «نصف شكارة» by itself in that
 * case, so this is only reached if he unticks it and asks for a whole one.
 */
export function onlyHalfBagLeft(phase: FeedPhase): string {
  return `مفيش غير نص شكارة ${FEED_PHASE_LABEL[phase]} في المخزن.`;
}

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
