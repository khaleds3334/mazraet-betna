"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * The round button that goes and fetches «عرض الاوزان بالتفصيل» (Khaled,
 * 2026-08-25).
 *
 * On an order whose invoice carries المدفوع and المتبقي the page runs two lines
 * longer, and the control that opens the weights falls off the bottom of the
 * screen. Nothing says it is down there — the customer reads to the total, finds
 * the page apparently finished, and never learns the table exists.
 *
 * So: when that control is not fully on screen, this appears beside «تواصل
 * معنا» and points at it. The moment it is in view, this goes — it is a
 * signpost, and a signpost pointing at something you are already looking at is
 * clutter.
 *
 * **Outlined, not filled** (Khaled): the same circle as the contact pill and the
 * same 44px, in the same tan edge, but the orange is spoken for. That is the
 * difference between a thing to do and a way to get somewhere. It carries the
 * page's own background rather than nothing at all, so the invoice does not read
 * through it as it scrolls past underneath.
 *
 * The arrow is the cards' arrow (`openDetails`) turned to face down — the glyph
 * this app already uses for "there is more of this over here".
 *
 * ## How it knows
 *
 * An `IntersectionObserver` on the disclosure's own button, found by
 * `data-weights-toggle`. Not a scroll listener with a measurement in it: the
 * question is exactly "is this element on screen", the browser answers it
 * natively, and the answer stays right when the table opens and the page grows
 * under it. On a screen with no weights at all (C-40, under review) it finds
 * nothing, observes nothing, and never shows.
 */
export function JumpToWeights() {
  const [show, setShow] = useState(false);
  const toggle = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const target = document.querySelector<HTMLElement>("[data-weights-toggle]");
    if (!target) return;
    toggle.current = target;

    // `threshold: 1` — half a button peeking over the floating row still needs
    // pointing at. It is either read or it is not.
    const watcher = new IntersectionObserver(
      ([entry]) => setShow(!entry.isIntersecting),
      { threshold: 1 },
    );
    watcher.observe(target);
    return () => watcher.disconnect();
  }, []);

  return (
    <button
      type="button"
      // Centred rather than parked at the bottom: the button is the last thing
      // on the page and `block: "end"` would tuck it under this very row.
      onClick={() =>
        toggle.current?.scrollIntoView({ block: "center", behavior: "smooth" })
      }
      aria-label="عرض الاوزان بالتفصيل"
      // Kept mounted and faded, so it arrives and leaves rather than blinking.
      aria-hidden={!show}
      inert={!show}
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-full",
        "border border-accent-tan bg-background text-primary-foreground shadow-card",
        // `scale`, not `transform`: Tailwind v4 compiles `scale-*` to the
        // standalone CSS `scale` property, so a transition naming only
        // `transform` animates the fade and lets the size snap.
        "transition-[opacity,scale] duration-200 motion-reduce:transition-none",
        // The floating row it sits in is `pointer-events-none` so taps fall
        // through to the invoice; the button has to take its own back.
        show
          ? "pointer-events-auto scale-100 opacity-100"
          : "pointer-events-none scale-90 opacity-0",
      )}
    >
      {/* `openDetails` points along the reading direction; a quarter turn
          anticlockwise faces it down the page. */}
      <Icon name="openDetails" size={24} aria-hidden className="-rotate-90" />
    </button>
  );
}
