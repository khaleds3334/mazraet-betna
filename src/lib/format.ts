/**
 * format.ts — the single place every number, price, weight, and date in the app
 * is turned into text. Nothing renders a raw number directly (CLAUDE.md rules 3–7).
 *
 * Why this matters: the admin reads no English and confuses Latin `2` and `5`,
 * so every digit shown to a user is Arabic-Indic (٠١٢٣٤٥٦٧٨٩). The only exception
 * is phone numbers, which stay Latin — use `formatPhone` for those.
 */
import { format, formatDistanceToNow } from "date-fns";
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
 * Lay a run of text out left-to-right inside our right-to-left pages, using a
 * Unicode isolate (U+2066 … U+2069).
 *
 * Needed for one thing only: a **negative** number. The minus sign is a neutral
 * character to the bidi algorithm, and Arabic-Indic digits are "Arabic numbers"
 * rather than "European numbers", so the two never bind — inside an RTL
 * paragraph the sign drifts to the far side and `-١٩١٥٩` renders as `١٩١٥٩-`,
 * which reads as a number with a dash after it. The isolate pins the sign where
 * it belongs without affecting anything around it.
 */
function ltrIsolate(text: string): string {
  return `\u2066${text}\u2069`;
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
  const digits = toArabicDigits(fixed);
  return value < 0 ? ltrIsolate(digits) : digits;
}

/**
 * Currency — always EGP with the unit visible (rule 5): `١٣٠٤ جنيه`.
 * Piasters show only when present: `٤٨٥.٤٠ جنيه`, but `١٣٠٤ جنيه` stays whole.
 * Decimal separator is a dot, matching weights, so the admin never sees two styles.
 */
export function formatCurrency(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
  // The unit stays outside the isolate — only the signed number is laid out LTR.
  const digits = toArabicDigits(text);
  return `${rounded < 0 ? ltrIsolate(digits) : digits} جنيه`;
}

/**
 * A kilo price, the short way both apps write it: `٨٥ ج/كجم`.
 *
 * Not `formatCurrency` — that says «جنيه» in full, which is right for a total
 * and too long for a rate sitting beside one. Here so the customer's confirm bar
 * and the admin's weighing header cannot drift apart.
 */
export function formatPricePerKilo(value: number): string {
  return `${formatArabicNumber(value)} ج/كجم`;
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
 * Read a number the admin typed — Arabic-Indic or Latin digits, with a dot, an
 * Arabic decimal mark, or a comma — into a number. Returns `null` when there is
 * no number in the text, so the caller can keep the previous value.
 *
 * {@link toLatinDigits} can't do this: it throws away the decimal separator along
 * with everything else that isn't a digit, turning `1.840` into `1840`. Two
 * fields need the fraction — a weight on the scale, and half a bag of feed — so
 * the reading lives here once and they both call it.
 */
export function parseDecimal(input: string): number | null {
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

/** {@link parseDecimal}, named for the field that has always used it (A-52). */
export const parseWeight = parseDecimal;

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
 * Bags of feed, as the farm says them — including the halves it buys and opens
 * (D-43): `صفر` · `نص شكارة` · `شكارة` · `شكارة ونص` · `شكارتين` · `شكارتين ونص` ·
 * `٣ شكاير` · `٣ شكاير ونص` · `١١ شكارة`.
 *
 * The half is a word, not a decimal: «شكارة ونص» is what he says out loud, and
 * «١.٥ شكارة» is what a spreadsheet says. The tiles still print the figure — this
 * is for the sentences.
 */
export function pluralizeBags(count: number): string {
  const whole = Math.floor(count);
  const half = count - whole >= 0.5;

  if (whole === 0) return half ? "نص شكارة" : "صفر";

  const bags =
    whole === 1
      ? "شكارة"
      : whole === 2
        ? "شكارتين"
        : whole <= 10
          ? `${toArabicDigits(whole)} شكاير`
          : `${toArabicDigits(whole)} شكارة`;

  return half ? `${bags} ونص` : bags;
}

/**
 * Feminine Arabic ordinals, for counting شكارة: `الأولى` … `العاشرة`. Past ten it
 * falls back to `رقم ١١` — the spelled-out ordinals get long and unfamiliar, and a
 * cycle rarely opens more than ten bags of one feed anyway.
 */
export function arabicOrdinal(n: number): string {
  const NAMES = [
    "الأولى",
    "الثانية",
    "الثالثة",
    "الرابعة",
    "الخامسة",
    "السادسة",
    "السابعة",
    "الثامنة",
    "التاسعة",
    "العاشرة",
  ];
  return NAMES[n - 1] ?? `رقم ${toArabicDigits(n)}`;
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

/**
 * How long ago, in words: «دلوقتي» · «منذ ٤ ساعات» · «منذ ٣ ايام» (C-15).
 *
 * `date-fns` writes the sentence and the Arabic locale declines it — «ساعة»,
 * «ساعتين», «٤ ساعات» are three different words and none of them is a rule worth
 * writing twice. The digits it produces are Latin, so they come back through
 * `toArabicDigits` like every other number in this app (rule 3).
 *
 * Under a minute reads «دلوقتي» rather than «منذ أقل من دقيقة»: on a screen the
 * customer opens straight after placing an order, the second is a sentence about
 * the clock where the first is an answer.
 */
export function formatTimeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Date.now() - d.getTime() < 60_000) return "دلوقتي";
  return toArabicDigits(
    formatDistanceToNow(d, { locale: ar, addSuffix: true }),
  );
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

/**
 * Arabic chick pluralization for a flock size, same shape as
 * {@link pluralizeChicken}: `١ كتكوت` · `٢ كتكوتين` · `٣–١٠ كتاكيت` · `١١+ كتكوت`.
 * A chick (كتكوت) is a bird still being raised; a فرخة is one ready to sell —
 * the two are never interchangeable to this admin.
 */
export function pluralizeChick(count: number): string {
  const n = toArabicDigits(count);
  if (count === 1) return `${n} كتكوت`;
  if (count === 2) return `${n} كتكوتين`;
  if (count >= 3 && count <= 10) return `${n} كتاكيت`;
  return `${n} كتكوت`; // 0 and 11+
}
