"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge, CloseButton, Icon, Modal } from "@/components/ui";
import type { BadgeTone } from "@/components/ui/Badge";
import { formatArabicDate, formatArabicNumber } from "@/lib/format";
import type { OrdersCycle } from "@/lib/queries/cycles";
import { cn } from "@/lib/utils";

/** How each phase introduces itself — the same pills as the cycles list. */
const PHASE: Record<OrdersCycle["phase"], { label: string; tone: BadgeTone }> = {
  raising: { label: "مرحلة التربية", tone: "success" },
  selling: { label: "مرحلة البيع", tone: "primary" },
  ended: { label: "دورة منتهية", tone: "danger" },
};

/**
 * The funnel at the top of the orders screen, and the cycle picker behind it
 * (A-50). The screen shows one cycle's orders at a time; this is how the admin
 * says which — usually to go back to the cycle he just closed and chase what is
 * still owed on it.
 *
 * The choice goes through the **router**, not the history API the tabs use: the
 * tabs are three views of a list already on the page, while another cycle is
 * another list the server has to read. `isPending` keeps the dialog open and the
 * row marked while that happens, so a tap on a slow connection doesn't look
 * ignored.
 */
export function CyclePickerButton({
  cycles,
  selectedId,
}: {
  cycles: OrdersCycle[];
  selectedId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [choosing, setChoosing] = useState<string | null>(null);

  function choose(cycle: OrdersCycle) {
    if (cycle.cycleId === selectedId) {
      setOpen(false);
      return;
    }
    setChoosing(cycle.cycleId);
    startTransition(() => {
      router.push(`/admin/orders?cycle=${cycle.cycleId}`);
      setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="اختار الدورة"
        aria-haspopup="dialog"
        className="flex size-11 shrink-0 items-center justify-center"
      >
        {/* 2px is the weight Figma draws it at. The icon's own stroke scales with
            `size`, so at 38px it would render ~2.4px and read heavy. */}
        <Icon
          name="filter"
          size={38}
          strokeWidth={2}
          absoluteStrokeWidth
          className="text-foreground"
        />
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        label="اختار الدورة"
        header={
          <div className="flex items-center justify-between gap-2">
            <p className="text-h6 font-bold text-heading">طلبات أنهي دورة؟</p>
            <CloseButton onClick={() => setOpen(false)} size="sm" />
          </div>
        }
      >
        <ul className="flex flex-col gap-2 pt-4">
          {cycles.map((cycle) => {
            const selected = cycle.cycleId === selectedId;
            const phase = PHASE[cycle.phase];

            return (
              <li key={cycle.cycleId}>
                <button
                  type="button"
                  onClick={() => choose(cycle)}
                  disabled={pending}
                  aria-current={selected}
                  className={cn(
                    "flex w-full min-h-14 items-center justify-between gap-3 rounded-xl border-2 px-3 py-2 text-right",
                    selected
                      ? "border-primary-hover bg-primary-soft"
                      : "border-border bg-surface-page",
                    choosing === cycle.cycleId && "opacity-60",
                  )}
                >
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="flex items-baseline gap-1">
                      <span className="text-base font-bold text-foreground">
                        {formatArabicNumber(cycle.seq)}-
                      </span>
                      <span className="truncate text-base font-bold text-heading">
                        {cycle.name ?? "دورة بدون اسم"}
                      </span>
                    </span>
                    <span className="text-xs text-disabled">
                      {formatArabicDate(cycle.startDate, "yyyy/M/d")}
                    </span>
                  </span>

                  <Badge tone={phase.tone} size="sm" className="shrink-0">
                    {phase.label}
                  </Badge>
                </button>
              </li>
            );
          })}
        </ul>
      </Modal>
    </>
  );
}
