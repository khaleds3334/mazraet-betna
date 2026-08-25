import Link from "next/link";
import { Icon } from "@/components/ui";
import { formatArabicDate, formatArabicTime } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The shape both of the customer's order cards are drawn in — the tracking list
 * (C-31→C-35) and the history list (C-51/C-52).
 *
 * Header, rule, body, closing line with the arrow. The two screens differ in
 * what they put in the middle and what pill they hang on the left, and in
 * nothing else: same border, same shadow, same full-bleed rule, same 35px arrow
 * opposite the same 14px sentence. Drawn twice by hand, they would drift the
 * first time one of those numbers is nudged.
 *
 * `badges` rather than one pill, because a finished order wears two: what
 * happened to it, and whether it was paid for (C-51).
 *
 * **Without an `href` it is not a card you can open, and it loses the arrow.**
 * The two go together: the arrow is the only thing on the card that says it
 * leads anywhere, so a card that leads nowhere must not wear one. A cancelled
 * order is the case (Khaled, 2026-08-25) — there is no detail screen behind it
 * worth the tap, since everything it has to say is already on its face.
 */
export function OrderCardShell({
  href,
  number,
  placedAt,
  badges,
  hint,
  hintCentred = false,
  children,
}: {
  /** Where it opens. Omit and the card is not a link and grows no arrow. */
  href?: string;
  /** Already formatted, e.g. «١٠٠٤». */
  number: string;
  /** When the order was placed — the card's second line. */
  placedAt: string;
  /** The pill or pills on the reading edge's far side. */
  badges: React.ReactNode;
  /** The closing sentence, beside the arrow. */
  hint: React.ReactNode;
  /** Held to a narrow measure and centred, the way the design breaks longer ones. */
  hintCentred?: boolean;
  children: React.ReactNode;
}) {
  const placed = new Date(placedAt);
  const body = (
    <>
      {/* In RTL the first child of a `justify-between` row lands on the RIGHT.
          The design puts the order number there and the status pill opposite,
          so the number block is written first. */}
      <div className="flex items-center justify-between gap-2 px-card">
        {/* No `items-end`: that shrinks each line to its own text and leaves
            the shorter one hanging. Stretching them both and aligning the text
            right is what puts the two on a single right edge, as drawn. */}
        <div className="flex flex-col gap-1 text-right">
          <p className="text-sm text-accent-tan">طلب رقم {number}#</p>
          <p className="text-xs text-timestamp">
            في {formatArabicDate(placed)} الساعة{" "}
            {formatArabicTime(
              `${placed.getHours()}:${String(placed.getMinutes()).padStart(2, "0")}`,
            )}
          </p>
        </div>

        {/* `items-end` — in RTL the end is the left edge, which is where the
            design lines the pills up when there are two of different widths. */}
        <div className="flex shrink-0 flex-col items-end gap-2">{badges}</div>
      </div>

      {/* Full-bleed on purpose — the design runs the rule to both edges while
          everything else keeps the card's padding. */}
      <hr className="border-t-[1.5px] border-foreground" />

      {children}

      <div className="flex items-center justify-between gap-2 px-card">
        {/* Held to a narrow measure and centred on the cards whose sentence runs
            long, which is how the design breaks it over two lines. `max-w` and
            not a fixed width so it still fits beside the arrow at 320px. With no
            arrow beside it the line has the whole card and keeps none of that. */}
        <p
          className={cn(
            "text-sm text-foreground",
            hintCentred && "text-center",
            hintCentred && href && "max-w-[195px]",
            !href && "w-full",
          )}
        >
          {hint}
        </p>
        {href && (
          <Icon
            name="openDetails"
            size={35}
            className="shrink-0 text-foreground"
          />
        )}
      </div>
    </>
  );

  const shape =
    "flex w-full flex-col gap-3.5 rounded-xl border border-border bg-surface-page py-[18px] shadow-card";

  return href ? (
    // `prefetch` in full, not just to the loading boundary: a customer has
    // a handful of orders, they are all on screen at once, and the page
    // behind a card is one database read the server can just as well do
    // while he is still reading the card. Same reasoning as `CycleRow` on
    // the admin's side. Production only — Next never prefetches from a dev
    // server.
    <Link href={href} prefetch replace className={shape}>
      {body}
    </Link>
  ) : (
    <div className={shape}>{body}</div>
  );
}

/**
 * The label/value lines in a card's middle block, as both lists draw them.
 * A `<dl>` because that is what they are: «السعر النهائي» is the term and the
 * money is its definition.
 */
export function OrderCardRows({
  rows,
}: {
  rows: {
    label: string;
    value: string;
    /** Counts and money are set in the label's own bold; measurements are not. */
    strong?: boolean;
    /** The weight breakdown only — it is a sentence, not a figure. */
    small?: boolean;
  }[];
}) {
  return (
    <dl className="flex flex-col gap-[7px] px-card text-foreground">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between">
          <dt className="text-base font-bold">{row.label}</dt>
          <dd
            className={
              row.strong
                ? "text-base font-bold"
                : row.small
                  ? "text-xs"
                  : "text-sm"
            }
          >
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
