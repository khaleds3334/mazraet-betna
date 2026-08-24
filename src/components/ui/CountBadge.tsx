import { formatArabicNumber } from "@/lib/format";

/**
 * The lime count disc that rides on the corner of an icon (Figma 3959:1549) —
 * orders in progress on the bottom nav, unread notifications on the bell.
 *
 * **The parent must be `relative` and sized to the icon**, since the disc pins
 * itself to that box: level with the top of the icon, overhanging its inline
 * start by 5px.
 *
 * It carries no horizontal padding on purpose. The 18px disc leaves 16.6px
 * inside its hairline, and at 12px Almarai the counts that actually turn up here
 * clear that easily — ٩٩ measures 12.7px. Padding would push the wider digits
 * out past 18px and turn the circle into an egg. A number too wide to fit
 * stretches it into a pill on its own, which is the right answer for one that
 * long.
 */
export function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span className="absolute -start-[5px] top-[1px] flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-[0.7px] border-white bg-primary text-[12px] font-bold leading-none text-foreground">
      {formatArabicNumber(count)}
    </span>
  );
}
