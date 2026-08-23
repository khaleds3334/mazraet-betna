"use client";

import { Icon } from "@/components/ui";
import {
  FIELD_ACTIVE_SHADOW,
  FIELD_ACTIVE_SHADOW_FOCUS,
} from "@/components/ui/fieldShadows";
import type { IconName } from "@/lib/icons";
import { cn } from "@/lib/utils";

/**
 * The trigger half of the two pickup pickers (C-20 nodes 3103:4022 / 3103:4032):
 * a label with a bordered box under it, the chosen value on the reading edge and
 * the icon on the far side.
 *
 * A button, not the shared `PickerField` — that one wears a native `<input
 * type="date">` and hands the choice to the operating system. Neither pickup
 * choice can be made that way: the day strip only offers the days the sale is
 * still open for, and the times are «قبل صلاة الظهر», not clock values (C-23,
 * C-24). Both are drawn in the design as in-app panels, so the trigger is a
 * button that opens one.
 */
export function PickupField({
  label,
  placeholder,
  value,
  icon,
  open = false,
  onToggle,
  controls,
}: {
  label: string;
  placeholder: string;
  /** The chosen day or slot, or "" when nothing is chosen yet. */
  value: string;
  icon: IconName;
  open?: boolean;
  /** Left off while the panel this opens is being redesigned — see `PickupPicker`. */
  onToggle?: () => void;
  /** Id of the panel this opens, for screen readers. */
  controls?: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <span className="text-right text-base text-foreground">{label}</span>

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={controls}
        className={cn(
          "flex min-h-11 w-full items-center gap-2 rounded-lg border px-3 transition-shadow",
          // An open field wears the same green glow a focused one does on the
          // login screen — it is the active field, and the app should say so the
          // one way it already says it (Khaled, 2026-08-23). `FIELD_ACTIVE_SHADOW`
          // and not the `focus-within` variant: the state here is "its panel is
          // open", which outlives the tap that opened it.
          open ? cn(FIELD_ACTIVE_SHADOW, "bg-surface-page") : "border-border bg-white",
          // Keyboard focus lights it up too, for the tab that never opens it.
          !open && FIELD_ACTIVE_SHADOW_FOCUS,
        )}
      >
        <Icon
          name={icon}
          size={24}
          aria-hidden
          className={cn(
            "shrink-0 text-foreground transition-transform",
            // Only the chevron turns; a calendar upside down means nothing.
            open && icon === "arrowDown" && "rotate-180",
          )}
        />
        <span
          className={cn(
            "flex-1 truncate text-right text-sm",
            value ? "text-foreground" : "text-disabled",
          )}
        >
          {value || placeholder}
        </span>
      </button>
    </div>
  );
}
