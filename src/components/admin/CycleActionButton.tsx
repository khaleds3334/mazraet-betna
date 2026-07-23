"use client";

import { useState } from "react";
import { BottomSheet, Icon } from "@/components/ui";
import type { IconName } from "@/lib/icons";
import { cn } from "@/lib/utils";
import {
  actionPillBase,
  actionPillVariant,
  type ActionPillVariant,
} from "./cycleActionStyles";

/**
 * A cycle-dashboard action button that opens a placeholder bottom sheet — used
 * for the add-expense (A-15) and withdraw-bag (A-13) forms, still to be built.
 * The button, the tap, and the sheet mechanics are already real; the body shows
 * a short "قيد الإنشاء" line for now. (Record-mortality already has its real
 * popup — see RecordMortalityButton.)
 */
export function CycleActionButton({
  label,
  icon,
  variant,
  className,
}: {
  label: string;
  icon?: IconName;
  variant: ActionPillVariant;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(actionPillBase, actionPillVariant[variant], className)}
      >
        {icon && <Icon name={icon} size={20} aria-hidden />}
        {label}
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} label={label}>
        <div className="flex flex-col items-center gap-2 px-screen py-10 text-center">
          <h2 className="text-h5 font-bold text-heading">{label}</h2>
          <p className="text-muted">الصفحة قيد الإنشاء…</p>
        </div>
      </BottomSheet>
    </>
  );
}
