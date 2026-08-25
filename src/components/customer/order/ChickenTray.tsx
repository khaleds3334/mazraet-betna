import Image from "next/image";
import { pluralizeChicken } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The tray, filling up as the customer counts (Figma section 3895:13770).
 *
 * Fourteen photographs, one per count from an empty tray to thirteen birds.
 * Khaled built fourteen and no more: past thirteen the tray is full, and the
 * design keeps showing the full one rather than inventing crowds nobody
 * photographed.
 *
 * **All fourteen are on screen at once, and only their opacity changes.**
 * Swapping one `src` for another would make every tap a network request the
 * first time and a decode every time — on the mid-range Android these customers
 * carry, that is a visible blink between «٣ فرخات» and «٤ فرخات», on the one
 * control the whole screen is about. Rendered together they are fetched once
 * when the screen opens, and from then on counting up is a CSS property change
 * with nothing to load.
 *
 * ## Why the images are bigger than the box
 *
 * Each Figma frame is 136×108, but the birds in most of them spill past it —
 * up to 6px below and 2px to the left — and that spill is solid bird, not
 * shadow, so it cannot be cropped away. The exports therefore came out at seven
 * different sizes, which would have made the tray jump as the count moved.
 *
 * They were re-canvassed onto one 415×342 sheet (at 3×) with every frame's own
 * 136×108 box landing at the same place: 6px in from the left, flush with the
 * top. Verified afterwards against the tray rim — thirteen of the fourteen are
 * pixel-identical, the last differs by a fraction of a pixel of anti-aliasing.
 *
 * So this box stays the design's 136×108 and the artwork is drawn slightly
 * larger *around* it, anchored top-left. The box is what the layout sees; the
 * overhang is free to bleed, which is exactly what it does in Figma.
 */
const TRAY_IMAGES = 14;

/** The re-canvassed sheet, and where the design's box sits inside it (3×). */
const SHEET_W = 415;
const SHEET_H = 342;
const BOX_W = 408; // 136 × 3
const PAD_LEFT = 6;

const BLEED = {
  width: `${((SHEET_W / BOX_W) * 100).toFixed(4)}%`,
  left: `${((-PAD_LEFT / BOX_W) * 100).toFixed(4)}%`,
};

/**
 * The two places the tray appears, and how wide it is in each.
 *
 * A prop and not a `className` override: `cn()` only joins strings, so a width
 * passed in from outside landed in the class list *beside* the default instead
 * of replacing it, and which of the two won came down to their order in the
 * built stylesheet. The confirm bar asked for 59px and got 136px.
 *
 * - `counter` — C-21, the counter's own tray. 136×108 at the 393px design
 *   width, fluid below it (the responsive guide's 320→430 rule) so the number
 *   beside it never runs out of room.
 * - `bar` — C-22, the read-back in the confirm bar (Figma 3155:4389 → 59×47).
 *   Fixed, because it sits next to one line of text and has no room to grow.
 */
const WIDTHS = {
  counter: "w-[clamp(112px,36vw,136px)]",
  bar: "w-[59px]",
} as const;

export function ChickenTray({
  count,
  size = "counter",
  className,
}: {
  count: number;
  size?: keyof typeof WIDTHS;
  className?: string;
}) {
  // Thirteen is both "thirteen" and "more than thirteen" — see above.
  const shown = Math.min(Math.max(Math.trunc(count), 0), TRAY_IMAGES - 1);

  return (
    <div
      role="img"
      aria-label={count > 0 ? `طبق فيه ${pluralizeChicken(count)}` : "طبق فاضي"}
      // The 136:108 box is the design's, at both sizes — 59×47 is the same
      // shape a fraction smaller, so one aspect ratio covers both.
      className={cn("relative aspect-[136/108] shrink-0", WIDTHS[size], className)}
    >
      {Array.from({ length: TRAY_IMAGES }, (_, index) => (
        <Image
          key={index}
          src={`/images/tray/tray-${String(index).padStart(2, "0")}.webp`}
          alt=""
          width={SHEET_W}
          height={SHEET_H}
          // Never lazy: the whole point is that all fourteen are decoded by the
          // time a finger reaches the «+». The empty tray is the one on screen at
          // first paint, so it is the only one worth preloading ahead of the rest.
          priority={index === 0}
          loading="eager"
          style={BLEED}
          className={cn(
            "absolute top-0 h-auto max-w-none transition-opacity duration-150",
            index === shown ? "opacity-100" : "opacity-0",
          )}
        />
      ))}
    </div>
  );
}
