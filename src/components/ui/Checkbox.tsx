"use client";

import { cn } from "@/lib/utils";

/**
 * A square tick box with its label — the Figma checkbox (24px, 2px outline,
 * 5px radius). The whole label is the control, so the tap target clears the
 * 44px rule even though the box itself is 24px.
 *
 * Box first in source: in this RTL app the first child lands on the right, which
 * is where the design puts it.
 */
export function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  /** Dimmed and inert — for a box whose feature isn't built yet. */
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-disabled={disabled || undefined}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        "flex min-h-11 items-center gap-1.5",
        disabled && "opacity-60",
        className,
      )}
    >
      <span
        className={cn(
          "relative size-6 shrink-0 rounded-[5px] border-2 transition-colors",
          checked
            ? "border-primary-hover bg-primary"
            : "border-control-border bg-transparent",
        )}
      >
        {checked && <TickGlyph />}
      </span>
      <span className="text-base font-bold text-primary-foreground">
        {label}
      </span>
    </button>
  );
}

/**
 * The tick from the design — a bespoke SVG, not an icon name (T-19): it is a
 * filled shape with a long tail and rounded ends, which no Hugeicons tick
 * matches. `-inset-0.5` cancels the box's 2px border so the 24-unit artwork
 * lands on the border box, exactly the coordinates Figma exported.
 */
function TickGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="absolute -inset-0.5 text-foreground"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.8237 7.65192C17.2913 8.0104 17.3805 8.67967 17.0232 9.14814L11.7212 16.0998C11.5343 16.3449 11.2509 16.4972 10.9438 16.5176C10.6367 16.5381 10.3358 16.4247 10.1182 16.2065L6.75297 12.8324C6.3368 12.4151 6.3368 11.7398 6.75297 11.3225C7.1707 10.9037 7.84913 10.9037 8.26686 11.3225L10.7658 13.828L15.3237 7.85192C15.6823 7.38177 16.3545 7.29214 16.8237 7.65192Z"
        fill="currentColor"
      />
    </svg>
  );
}
