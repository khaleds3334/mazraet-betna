"use client";

import { Icon } from "./Icon";
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
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn("flex min-h-11 items-center gap-1.5", className)}
    >
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-[5px] border-2 transition-colors",
          checked
            ? "border-primary-hover bg-primary"
            : "border-control-border bg-transparent",
        )}
      >
        {checked && (
          <Icon name="check" size={16} className="text-primary-foreground" />
        )}
      </span>
      <span className="text-base font-bold text-primary-foreground">
        {label}
      </span>
    </button>
  );
}
