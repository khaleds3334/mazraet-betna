/**
 * What counts as a real Egyptian mobile number.
 *
 * Every Egyptian mobile is 11 digits and starts with one of four network
 * prefixes — 010 (Vodafone) · 011 (Etisalat) · 012 (Orange) · 015 (WE).
 * Checking only the length lets a typo like `013…` through, and because the
 * phone number is what identifies a customer for life on this farm, a wrong
 * number means an order that can never be traced back to a person.
 *
 * Formatting a number for display lives in `format.ts` (`formatPhone`); this
 * file holds the rule for whether a number is valid at all, and the one
 * conversion the outside world needs (`whatsappNumber`).
 */

/** 11 digits, starting with a real network prefix. */
export const EGYPT_MOBILE_RE = /^01[0125]\d{8}$/;

/** Strips anything that isn't a digit — what the user typed may hold spaces. */
export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "");
}

/** True when `phone` (digits only) is a valid Egyptian mobile number. */
export function isEgyptianMobile(phone: string): boolean {
  return EGYPT_MOBILE_RE.test(phone);
}

/**
 * Why this number was refused, in the user's words — or `null` when it is fine.
 *
 * Four different mistakes used to share one message, which left the user
 * re-reading their own number with no idea which part was wrong. Each case now
 * names the thing to fix, because these users re-tap rather than re-read (rule
 * 11) and a vague message earns another tap, not a correction.
 *
 * Counts are Arabic-Indic (rule 3); the prefixes stay Latin because they are the
 * start of a phone number — the FR-3 exception — and that is how the user sees
 * them on the keypad and in the field.
 *
 * Use this wherever someone *typed* the number. Where it arrives from a URL
 * (the PIN and register screens), use {@link isEgyptianMobile} instead: nothing
 * on those screens can fix it, so they send the user back to login.
 */
export function phoneError(phone: string): string | null {
  if (phone.length === 0) return "اكتب رقم موبايلك الأول.";
  if (phone.length < 11) return "الرقم ناقص، لازم يكون ١١ رقم.";
  if (phone.length > 11) return "الرقم زيادة، لازم يكون ١١ رقم بالظبط.";
  if (!isEgyptianMobile(phone)) {
    return "الرقم لازم يبدأ بـ 010 أو 011 أو 012 أو 015.";
  }
  return null;
}

/**
 * Egyptian local number (01…) → the international form `wa.me` expects.
 *
 * Numbers are stored the way both users type and read them back — the local
 * `01…` — so the country code is added at the point of use rather than kept in
 * the database, where it would have to be stripped again for every field that
 * shows a number.
 *
 * Two callers: the admin's contact shortcuts beside a customer (`ContactLinks`)
 * and the customer's «تواصل معنا» popup (`ContactSheet`). It lived inside the
 * first of them until the second needed it too.
 */
export function whatsappNumber(phone: string): string {
  const digits = normalizePhone(phone);
  return digits.startsWith("0") ? `20${digits.slice(1)}` : digits;
}
