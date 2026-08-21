import { formatArabicNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The «بادي / نامي» value the feed tiles print — one figure per feed, each
 * coloured on its own (D-46).
 *
 * The two feeds are separate stores, so a single colour for the pair would say
 * the wrong thing about one of them: «٠ / ٣» is an emergency on the left and
 * perfectly fine on the right, and the admin reads this tile at a glance while
 * standing in the feed store. That is also why the two sides take their own
 * classes — in «العلف المسحوب» they aren't even the same colour to begin with.
 *
 * Two rules the component keeps for itself, so no tile can get them wrong:
 *   • **an alerting side is red**, whatever it was going to be;
 *   • **a negative figure is a surplus**, not a fault — `-١` in «العلف المطلوب»
 *     means one bag more than the estimate is already in, and it goes **green**.
 *     Alerts never fire on one anyway: nothing is owed.
 *
 * **Why green and not red, and no longer lime.** Red in this very tile means the
 * opposite — feed is owed and the store is empty — and one colour saying both
 * «ينقصك» and «عندك زيادة» in the same pair is exactly what D-47 was written to
 * stop. Lime was the first choice and had to go: بادي took it (D-48), so a lime
 * figure here would read as "this number is about بادي" rather than "this number
 * is a surplus". Green is the app's plain "this is fine", and it appears nowhere
 * else in the feed tiles (Khaled, 2026-08-21).
 */
export function FeedPhasePair({
  badi,
  nami,
  badiAlert = false,
  namiAlert = false,
  badiClassName,
  namiClassName,
}: {
  badi: number;
  nami: number;
  /** Red — this feed is the one that needs a decision. */
  badiAlert?: boolean;
  namiAlert?: boolean;
  /** Colour for that side while it is neither alerting nor a surplus. */
  badiClassName?: string;
  namiClassName?: string;
}) {
  const side = (value: number, alert: boolean, className?: string) =>
    cn(alert ? "text-error" : value < 0 ? "text-success" : className);

  return (
    // The separator stays neutral: it belongs to neither figure.
    <span>
      <span className={side(badi, badiAlert, badiClassName)}>
        {formatArabicNumber(badi)}
      </span>
      <span className="text-muted"> / </span>
      <span className={side(nami, namiAlert, namiClassName)}>
        {formatArabicNumber(nami)}
      </span>
    </span>
  );
}
