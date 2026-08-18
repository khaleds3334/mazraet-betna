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
 * A stepper button from the design: a soft lime rounded square (rx=6) behind a
 * green glyph, with a faint lime glow behind it. The visible square IS the touch
 * target — at the default 44px it already meets the ≥44px admin touch-target
 * rule, so no extra wrapper is needed. `size` lets a caller scale it, but keep it
 * ≥44 for anything the admin taps while weighing.
 */
export function StepButton({
  onClick,
  label,
  sign = "plus",
  size = 44,
}: {
  onClick: () => void;
  label: string;
  sign?: "plus" | "minus";
  size?: number;
}) {
  const glyphSize = Math.round(size * 0.5833);
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{
        width: size,
        height: size,
        boxShadow: "0 0 10px 0 rgba(217,249,157,0.4)",
      }}
      className="flex shrink-0 items-center justify-center rounded-md bg-surface text-foreground"
    >
      {sign === "plus" ? (
        <PlusGlyph size={glyphSize} />
      ) : (
        <MinusGlyph size={glyphSize} />
      )}
    </button>
  );
}
