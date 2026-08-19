/**
 * format.ts — the single place every number, price, weight, and date in the app
 * is turned into text. Nothing renders a raw number directly (CLAUDE.md rules 3–7).
 *
 * Why this matters: the admin reads no English and confuses Latin `2` and `5`,
 * so every digit shown to a user is Arabic-Indic (٠١٢٣٤٥٦٧٨٩). The only exception
 * is phone numbers, which stay Latin — use `formatPhone` for those.
 */
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const ARABIC_DIGITS = [
  "٠",
  "١",
  "٢",
  "٣",
  "٤",
  "٥",
  "٦",
  "٧",
  "٨",
  "٩",
] as const;

/** Convert every Latin digit (0–9) in a string/number to its Arabic-Indic form. */
export function toArabicDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => ARABIC_DIGITS[Number(d)]);
}

/**
 * The inverse of {@link toArabicDigits}, then keep digits only — turns typed
 * input (Arabic-Indic ٠١٢ or Latin 012) into a bare Latin digit string ready for
 * `Number(...)`. Use in any numeric field the user types into (e.g. NumberStepper).
 */
export function toLatinDigits(input: string): string {
  return input
    .replace(/[٠-٩]/g, (d) =>
      String(ARABIC_DIGITS.indexOf(d as (typeof ARABIC_DIGITS)[number])),
    )
    .replace(/\D/g, "");
}

/**
 * A plain number in Arabic-Indic digits. No unit, no grouping (the Figma design
 * shows `١٣٠٤`, not `١٬٣٠٤`). Pass `decimals` to fix the fraction length.
 */
export function formatArabicNumber(
  value: number,
  options?: { decimals?: number },
): string {
  const fixed =
    options?.decimals != null ? value.toFixed(options.decimals) : String(value);
  return toArabicDigits(fixed);
}

/**
 * Currency — always EGP with the unit visible (rule 5): `١٣٠٤ جنيه`.
 * Piasters show only when present: `٤٨٥.٤٠ جنيه`, but `١٣٠٤ جنيه` stays whole.
 * Decimal separator is a dot, matching weights, so the admin never sees two styles.
 */
export function formatCurrency(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
  return `${toArabicDigits(text)} جنيه`;
}

/**
 * Weight — always 3 decimals with a dot (rule 6): `١.٨٤٠ كجم`.
 * Set `withUnit: false` for the bare number inside a weighing input.
 */
export function formatWeight(
  value: number,
  options?: { withUnit?: boolean },
): string {
  const number = toArabicDigits(value.toFixed(3));
  return options?.withUnit === false ? number : `${number} كجم`;
}

/**
 * Read a weight the admin typed — Arabic-Indic or Latin digits, with a dot, an
 * Arabic decimal mark, or a comma — into a number. Returns `null` when there is
 * no number in the text, so the caller can keep the previous value.
 *
 * {@link toLatinDigits} can't do this: it throws away the decimal separator
 * along with everything else that isn't a digit, turning `1.840` into `1840`.
 */
export function parseWeight(input: string): number | null {
  const normalized = input
    .replace(/[٠-٩]/g, (d) =>
      String(ARABIC_DIGITS.indexOf(d as (typeof ARABIC_DIGITS)[number])),
    )
    .replace(/[٫,]/g, ".")
    .replace(/[^0-9.]/g, "");

  // Keep only the first dot — "1.8.4" is a slip, not a second decimal place.
  const [whole, ...rest] = normalized.split(".");
  const text = rest.length > 0 ? `${whole}.${rest.join("")}` : whole;

  const value = Number(text);
  return text === "" || !Number.isFinite(value) ? null : value;
}

/**
 * Arabic chicken pluralization (rule 7) — never a blanket `${n} فرخات`.
 *   ١ فرخة · ٢ فرختين · ٣–١٠ فرخات · ١١+ (and ٠) فرخة
 */
export function pluralizeChicken(count: number): string {
  const n = toArabicDigits(count);
  if (count === 1) return `${n} فرخة`;
  if (count === 2) return `${n} فرختين`;
  if (count >= 3 && count <= 10) return `${n} فرخات`;
  return `${n} فرخة`; // 0 and 11+
}

/**
 * Arabic order pluralization, same shape as {@link pluralizeChicken}:
 * `١ طلب` · `٢ طلبين` · `٣–١٠ طلبات` · `١١+ طلب`.
 */
export function pluralizeOrder(count: number): string {
  const n = toArabicDigits(count);
  if (count === 2) return `${n} طلبين`;
  if (count >= 3 && count <= 10) return `${n} طلبات`;
  return `${n} طلب`; // 0, 1, and 11+
}

/**
 * Arabic customer pluralization, same shape as {@link pluralizeChicken}:
 * `١ عميل` · `٢ عميلين` · `٣–١٠ عملاء` · `١١+ عميل`. Zero reads
 * `٠ عملاء` — not `عميل` — because that is what the design draws on the empty
 * customers screen (A-30).
 */
export function pluralizeCustomer(count: number): string {
  const n = toArabicDigits(count);
  if (count === 1) return `${n} عميل`;
  if (count === 2) return `${n} عميلين`;
  if (count === 0 || (count >= 3 && count <= 10)) return `${n} عملاء`;
  return `${n} عميل`; // 11+
}

/**
 * Arabic day pluralization for the flock age (FR-7), same shape as
 * {@link pluralizeChicken}: `١ يوم` · `٢ يومين` · `٣–١٠ ايام` · `١١+ يوم`.
 */
export function pluralizeDay(count: number): string {
  const n = toArabicDigits(count);
  if (count === 2) return `${n} يومين`;
  if (count >= 3 && count <= 10) return `${n} ايام`;
  return `${n} يوم`; // 0, 1, and 11+
}

/** A date in Arabic month names + Arabic-Indic digits, e.g. `٢٢ يوليو ٢٠٢٦`. */
export function formatArabicDate(
  date: Date | string,
  pattern = "d MMMM yyyy",
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return toArabicDigits(format(d, pattern, { locale: ar }));
}

/**
 * A `HH:mm` clock value (how pickup slots are stored) shown in Arabic digits
 * with the period marker, e.g. `١٦:٠٠` → `٤:٠٠ م`. Pass `period: "long"` for the
 * spelled-out form (`صباحا` / `مساءا`) where the short letter reads too tersely
 * (e.g. after picking a specific time, as opposed to a pickup-slot chip).
 */
export function formatArabicTime(
  time: string,
  options?: { period?: "short" | "long" },
): string {
  const [hStr, mStr = "00"] = time.split(":");
  const hour = Number(hStr);
  const isAm = hour < 12;
  const period =
    options?.period === "long" ? (isAm ? "صباحا" : "مساءا") : isAm ? "ص" : "م";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${toArabicDigits(hour12)}:${toArabicDigits(mStr)} ${period}`;
}

/**
 * The number the admin reads out loud, e.g. `١٠٠٤` (Khaled, 2026-08-18): the
 * cycle's number followed by the order's number inside that cycle, padded to
 * three digits. Order 4 of cycle 1 → 1004. Both counters come from the database
 * (migration 009), so the number never shifts once it is given.
 */
export function formatOrderNumber(cycleSeq: number, orderSeq: number): string {
  return toArabicDigits(`${cycleSeq}${String(orderSeq).padStart(3, "0")}`);
}

/** Phone numbers stay in Latin digits (the one exception to rule 3). */
export function formatPhone(phone: string): string {
  return phone;
}
