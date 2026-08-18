"use client";

import { cn } from "@/lib/utils";

/**
 * The Figma switch (49×24): a lime track with a dark-green knob that rests on the
 * right when on, exactly as the design draws it — which in this RTL app is the
 * inline **start**, so the offsets are written with `start-*` and mirror
 * correctly if the app is ever read left-to-right.
 *
 * Its own tap target is under 44px, so it is always rendered next to a label
 * that shares the row's height (see how `AddOrderSheet` pairs the two).
 */
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-[49px] shrink-0 rounded-full shadow-field transition-colors",
        checked ? "bg-primary" : "bg-control-border",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 size-5 rounded-full bg-brand transition-[inset-inline-start] duration-200",
          checked ? "start-0.5" : "start-[27px]",
        )}
      />
    </button>
  );
}
