import { formatArabicNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The count disc that rides on the corner of an icon (Figma 3959:1549) — orders
 * in progress on the bottom nav, unread notifications on the bell.
 *
 * **Two tones.** Lime on the nav, where it counts a thing that is going well, and
 * the contact pill's orange on the bell, where it counts something asking to be
 * read (Khaled, 2026-08-25). Lime on the bell sat on a lime tab bar an inch
 * below and read as decoration rather than a number.
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
export function CountBadge({
  count,
  tone = "primary",
}: {
  count: number;
  tone?: "primary" | "accent";
}) {
  if (count <= 0) return null;

  return (
    <span
      className={cn(
        "absolute -start-[5px] top-[1px] flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-[0.7px] border-white text-[12px] font-bold leading-none",
        tone === "accent"
          ? "bg-accent-orange text-primary-foreground"
          : "bg-primary text-foreground",
      )}
    >
      {formatArabicNumber(count)}
    </span>
  );
}
