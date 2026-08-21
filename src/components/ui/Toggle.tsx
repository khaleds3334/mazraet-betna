"use client";

import { cn } from "@/lib/utils";

/**
 * The Figma switch (49×24, node 3322:17112) with both its states:
 *
 * - **off** — grey track, **white** knob resting on the left
 * - **on**  — lime track, dark-green knob slid over to the right
 *
 * The knob is positioned with physical `left`, not `start`: the design draws
 * this switch the same way inside the RTL screens, so it must not mirror.
 *
 * Its own tap target is under 44px, so it is always rendered next to a label
 * that shares the row's height (see how `AddOrderSheet` pairs the two).
 */
export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  /** Greys the switch and refuses the tap — when there is nothing to switch. */
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-[49px] shrink-0 rounded-full shadow-field transition-colors",
        checked ? "bg-primary" : "bg-control-border",
        disabled && "cursor-not-allowed",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 size-5 rounded-full shadow-toggle-knob transition-[left,background-color] duration-200",
          checked ? "left-[27px] bg-brand" : "left-0.5 bg-white",
        )}
      />
    </button>
  );
}
