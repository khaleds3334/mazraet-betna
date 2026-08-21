"use client";

import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * The two stepper glyphs from the design (Iconify "ic:round-plus" and
 * "humbleicons:minus"). Bespoke design SVGs on purpose: the Hugeicons free pack
 * doesn't provide these exact shapes, so they live in their own component (same
 * rationale as T-19). Each viewBox is a tight crop of the glyph's own bounding
 * box — the parent square supplies the padding via flex centering.
 */
function PlusGlyph({ size }: { size: number }) {
  return (
    <svg
      viewBox="19.1667 19.163 25.6666 25.6667"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden
    >
      <path d="M43 33.8297H33.8333V42.9963C33.8333 43.4826 33.6402 43.9489 33.2964 44.2927C32.9525 44.6365 32.4862 44.8297 32 44.8297C31.5138 44.8297 31.0475 44.6365 30.7036 44.2927C30.3598 43.9489 30.1667 43.4826 30.1667 42.9963V33.8297H21C20.5138 33.8297 20.0475 33.6365 19.7036 33.2927C19.3598 32.9489 19.1667 32.4826 19.1667 31.9963C19.1667 31.5101 19.3598 31.0438 19.7036 30.7C20.0475 30.3562 20.5138 30.163 21 30.163H30.1667V20.9963C30.1667 20.5101 30.3598 20.0438 30.7036 19.7C31.0475 19.3562 31.5138 19.163 32 19.163C32.4862 19.163 32.9525 19.3562 33.2964 19.7C33.6402 20.0438 33.8333 20.5101 33.8333 20.9963V30.163H43C43.4862 30.163 43.9525 30.3562 44.2964 30.7C44.6402 31.0438 44.8333 31.5101 44.8333 31.9963C44.8333 32.4826 44.6402 32.9489 44.2964 33.2927C43.9525 33.6365 43.4862 33.8297 43 33.8297Z" />
    </svg>
  );
}

/** A round-capped bar, drawn on the same 25.67 grid as the plus so both match. */
function MinusGlyph({ size }: { size: number }) {
  return (
    <svg
      viewBox="19.1667 19.163 25.6666 25.6667"
      width={size}
      height={size}
      fill="none"
      aria-hidden
    >
      <path
        d="M43 31.9963H21"
        stroke="currentColor"
        strokeWidth="4.67"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Press-and-hold, in gears. A held button repeats, and the gaps between repeats
 * shorten the longer it is held: the admin who wants ٢٥ شكارة should not tap
 * twenty-five times, and the one who wants ٣ should not overshoot to ١٢ because
 * the button took off under his thumb (Khaled, 2026-08-21).
 *
 * `after` is how many repeats have already fired; the last matching gear wins.
 * The amount added per repeat never changes — only the rate. A stepper that
 * silently starts adding ٥ at a time is a number the admin can't predict, and
 * these are bags of feed and pounds of money.
 */
const HOLD_DELAY_MS = 450;
const GEARS = [
  { after: 0, everyMs: 260 },
  { after: 6, everyMs: 130 },
  { after: 14, everyMs: 60 },
];

/**
 * A stepper button from the design, in the two weights it is drawn in:
 *   • `soft` — a pale lime square under a faint glow, 44px (the weighing rows)
 *   • `solid` — a small filled lime square, 24px (the split dialog)
 *
 * However small it is drawn, it stays a 44px target: an invisible pad is centred
 * on it, so the finger gets the size the admin needs (rule 8) while the design
 * keeps the size it asks for. Everything the admin taps here, he taps standing
 * over a scale.
 *
 * A tap fires `onClick` once; holding it repeats (see `GEARS`). A scroll that
 * starts on the button cancels the hold rather than running it in the background,
 * which is what `pointercancel` is for.
 */
export function StepButton({
  onClick,
  label,
  sign = "plus",
  size = 44,
  tone = "soft",
  disabled = false,
}: {
  onClick: () => void;
  label: string;
  sign?: "plus" | "minus";
  size?: number;
  tone?: "soft" | "solid";
  disabled?: boolean;
}) {
  const glyphSize = Math.round(size * 0.5833);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeats = useRef(0);
  // Set once a hold has fired, so the click that follows the release doesn't
  // add one more on top of everything the hold already added.
  const held = useRef(false);

  // The chain of timeouts has to call the *latest* `onClick`, not the one from
  // the render the press started in: a stepper's handler closes over the current
  // value, so a stale one would add the step to the same number every time and
  // the field would freeze one step above where it started. The ref is refreshed
  // after every render, which lands long before the next repeat is due.
  const fire = useRef(onClick);
  useEffect(() => {
    fire.current = onClick;
  });

  const stop = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    repeats.current = 0;
  }, []);

  // A declaration, not a `useCallback`: it schedules itself, and a `const` cannot
  // be named inside its own initializer.
  function repeat() {
    held.current = true;
    fire.current();
    repeats.current += 1;

    const gear =
      GEARS.filter((g) => repeats.current >= g.after).at(-1) ?? GEARS[0];
    timer.current = setTimeout(repeat, gear.everyMs);
  }

  // A button unmounted mid-hold (the sheet closed under it) must not keep firing.
  useEffect(() => stop, [stop]);

  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        if (held.current) {
          held.current = false;
          return;
        }
        onClick();
      }}
      onPointerDown={() => {
        if (disabled) return;
        held.current = false;
        timer.current = setTimeout(repeat, HOLD_DELAY_MS);
      }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      disabled={disabled}
      style={{
        width: size,
        height: size,
        boxShadow:
          tone === "soft" ? "0 0 10px 0 rgba(217,249,157,0.4)" : undefined,
      }}
      className={cn(
        "relative flex shrink-0 touch-manipulation items-center justify-center rounded-md text-foreground select-none disabled:opacity-40",
        tone === "soft" ? "bg-surface" : "bg-primary",
        // The tap target, centred on the square and never under 44px.
        "before:absolute before:top-1/2 before:left-1/2 before:size-11 before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']",
      )}
    >
      {sign === "plus" ? (
        <PlusGlyph size={glyphSize} />
      ) : (
        <MinusGlyph size={glyphSize} />
      )}
    </button>
  );
}
