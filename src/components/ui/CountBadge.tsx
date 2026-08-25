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
 * itself to that box, level with the top of the icon.
 *
 * **Two placements.** `overhang` hangs it 5px past the icon's inline start — the
 * bottom nav, where the tab label underneath leaves room for it. `inset` tucks it
 * flush instead, for the bell, whose 44px tap target sits at the very edge of the
 * header and had the disc leaning out of it (Khaled, 2026-08-25).
 *
 * A prop with named options rather than a `className` to override with: `cn()`
 * joins strings and does not merge Tailwind, so a position passed in would land
 * beside the default and win or lose on stylesheet order (T-64).
 *
 * It carries no horizontal padding on purpose. The 18px disc leaves 16.6px
 * inside its hairline, and at 12px Almarai the counts that actually turn up here
 * clear that easily — ٩٩ measures 12.7px. Padding would push the wider digits
 * out past 18px and turn the circle into an egg. A number too wide to fit
 * stretches it into a pill on its own, which is the right answer for one that
 * long.
 */
const PLACEMENT = {
  overhang: "-start-[5px] top-[1px]",
  inset: "start-[1px] top-[1px]",
} as const;

export function CountBadge({
  count,
  tone = "primary",
  placement = "overhang",
}: {
  count: number;
  tone?: "primary" | "accent";
  placement?: keyof typeof PLACEMENT;
}) {
  if (count <= 0) return null;

  return (
    <span
      className={cn(
        "absolute flex h-[16px] min-w-[16px] items-center justify-center rounded-full border-[1px] border-white text-[12px] font-bold leading-none",
        PLACEMENT[placement],
        tone === "accent"
          ? "bg-accent-orange text-primary-foreground"
          : "bg-primary text-foreground",
      )}
    >
      {formatArabicNumber(count)}
    </span>
  );
}
